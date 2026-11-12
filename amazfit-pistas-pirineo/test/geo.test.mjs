import test from 'node:test'
import assert from 'node:assert/strict'
import {
  project, pointSegmentDistance, pointInRing, distanceToFeature,
  buildIndex, nearest, nearestZone, createTracker, pisteLabel, difficultyInfo,
} from '../utils/geo.js'

// Geometría sintética de prueba (no son pistas reales).
const roja = { n: 'Prueba Roja', r: '7', d: 'intermediate', p: [0, 0, 0, -500, 50, -1000] }
const azul = { n: 'Prueba Azul', d: 'easy', p: [200, 0, 200, -800] }
const area = { n: 'Zona debutantes', d: 'novice', a: 1, p: [400, 0, 600, 0, 600, -200, 400, -200] }
const lift = { n: 'TSD Prueba', t: 'chair_lift', p: [100, -1000, 100, 0] }

test('proyección: 1 milésima de grado de latitud ≈ 110 m', () => {
  const p = project(42.801, -0.4, 42.8, -0.4)
  assert.ok(Math.abs(p.y - 110.574) < 0.01)
  assert.ok(Math.abs(p.x) < 1e-9)
  const q = project(42.8, -0.399, 42.8, -0.4)
  assert.ok(Math.abs(q.x - 111.32 * Math.cos((42.8 * Math.PI) / 180)) < 0.01)
})

test('distancia a segmento y polígono', () => {
  assert.equal(pointSegmentDistance(10, -100, 0, 0, 0, -500), 10)
  assert.equal(pointSegmentDistance(0, 30, 0, 0, 0, -500), 30)
  assert.ok(pointInRing(500, -100, area.p))
  assert.ok(!pointInRing(700, -100, area.p))
  assert.equal(distanceToFeature(500, -100, area), 0)
  assert.equal(distanceToFeature(650, -100, area), 50)
  // Un área cerrada mide también el lado de cierre (último -> primer punto).
  assert.equal(distanceToFeature(380, -100, area), 20)
})

test('índice espacial encuentra la pista más cercana', () => {
  const idx = buildIndex([roja, azul, area].map((f) => ({ ...f })))
  assert.equal(nearest(idx, 15, -300, 400).feature.n, 'Prueba Roja')
  assert.equal(nearest(idx, 180, -300, 400).feature.n, 'Prueba Azul')
  assert.equal(nearest(idx, 5000, 5000, 400), null)
})

test('zona más cercana', () => {
  const zones = [{ id: 'a', lat0: 42.79, lon0: -0.5 }, { id: 'b', lat0: 42.57, lon0: 0.55 }]
  assert.equal(nearestZone(zones, 42.58, 0.54).zone.id, 'b')
})

test('tracker: en pista, fuera con histéresis, y remonte', () => {
  const pi = buildIndex([roja, azul, area].map((f) => ({ ...f })))
  const li = buildIndex([{ ...lift }])
  const t = createTracker({ offFixes: 3 })
  let s = t.update(pi, li, 10, -200, 0)
  assert.equal(s.piste.n, 'Prueba Roja')
  assert.equal(s.offPiste, false)
  // 1 y 2 fixes fuera: aún no avisa (ruido GPS)
  t.update(pi, li, -80, -200, 0)
  s = t.update(pi, li, -80, -200, 0)
  assert.equal(s.offPiste, false)
  s = t.update(pi, li, -80, -200, 0)
  assert.equal(s.offPiste, true)
  // Zona intermedia (entre 30 y 45 m) mantiene el estado
  s = t.update(pi, li, -38, -200, 0)
  assert.equal(s.offPiste, true)
  s = t.update(pi, li, -5, -200, 0)
  assert.equal(s.offPiste, false)
  // En el remonte no se considera fuera de pista
  s = t.update(pi, li, 102, -600, 0)
  assert.equal(s.lift.n, 'TSD Prueba')
  assert.equal(s.offPiste, false)
})

test('tracker: mantiene la pista actual en un cruce', () => {
  const a = { n: 'A', p: [0, 0, 0, -400] }
  const b = { n: 'B', p: [-200, -200, 200, -200] }
  const pi = buildIndex([a, b].map((f) => ({ ...f })))
  const t = createTracker()
  t.update(pi, null, 0, -100, 0)
  assert.equal(t.state.piste.n, 'A')
  const s = t.update(pi, null, 3, -198, 0) // más cerca de B, pero sigue sobre A
  assert.equal(s.piste.n, 'A')
})

test('etiquetas', () => {
  assert.equal(pisteLabel({ n: 'Sarrios', r: '12' }), '12 · Sarrios')
  assert.equal(pisteLabel({ r: '3' }), 'Pista 3')
  assert.equal(pisteLabel({}), 'Pista sin nombre')
  assert.equal(difficultyInfo('advanced').label, 'NEGRA')
  assert.equal(difficultyInfo(undefined).label, 'SIN CLASIF.')
})
