import test from 'node:test'
import assert from 'node:assert/strict'
import { buildZone, renderModule } from '../scripts/fetch-pistes.mjs'

// Respuesta de Overpass sintética.
const g = (pts) => pts.map(([lat, lon]) => ({ lat, lon }))
const elements = [
  { type: 'way', id: 1, tags: { 'piste:type': 'downhill', 'piste:difficulty': 'easy' },
    geometry: g([[42.80, -0.50], [42.799, -0.50003], [42.798, -0.5000], [42.797, -0.50]]) },
  { type: 'way', id: 2, tags: { 'piste:type': 'downhill', area: 'yes', name: 'Debutantes', 'piste:difficulty': 'novice' },
    geometry: g([[42.801, -0.49], [42.801, -0.489], [42.800, -0.489], [42.800, -0.49], [42.801, -0.49]]) },
  { type: 'way', id: 3, tags: { aerialway: 'chair_lift', name: 'TSD Prueba' }, geometry: g([[42.797, -0.495], [42.802, -0.495]]) },
  { type: 'way', id: 4, tags: { aerialway: 'station' }, geometry: g([[42.797, -0.495], [42.7971, -0.495]]) },
  { type: 'way', id: 5, tags: { 'piste:type': 'downhill' }, geometry: g([[43.5, 1.0], [43.6, 1.0]]) },
  { type: 'relation', id: 9, tags: { 'piste:type': 'downhill', name: 'Prueba Azul', ref: '4', 'piste:difficulty': 'easy' },
    members: [{ type: 'way', ref: 1 }] },
]
const zone = { id: 'z', name: 'Zona', bbox: [42.78, -0.52, 42.82, -0.47] }

test('construye zona con herencia de relación, áreas, remontes y recorte', () => {
  const taken = new Set()
  const z = buildZone(zone, elements, taken)
  assert.equal(z.pistes.length, 2)
  const p1 = z.pistes.find((p) => p.n === 'Prueba Azul')
  assert.equal(p1.r, '4')
  assert.equal(p1.d, 'easy')
  assert.ok(!p1.a)
  // Douglas-Peucker: los puntos casi alineados se reducen
  assert.ok(p1.p.length <= 6)
  const p2 = z.pistes.find((p) => p.n === 'Debutantes')
  assert.equal(p2.a, 1)
  assert.equal(p2.p.length, 8) // 4 vértices sin repetir el cierre
  assert.equal(z.lifts.length, 1)
  assert.equal(z.lifts[0].t, 'chair_lift')
  // Las vías ya asignadas no se repiten en otra zona
  assert.equal(buildZone(zone, elements, taken), null)
})

test('el módulo generado es importable', async () => {
  const z = buildZone(zone, elements, new Set())
  const src = renderModule([z])
  const mod = await import('data:text/javascript,' + encodeURIComponent(src))
  assert.equal(mod.ZONES[0].pistes.length, 2)
})
