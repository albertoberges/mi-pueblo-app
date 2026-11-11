#!/usr/bin/env node
// Descarga de OpenStreetMap (Overpass API) las pistas y remontes de las
// estaciones del Pirineo aragonés y genera data/pistes.js para el reloj.
//
//   node scripts/fetch-pistes.mjs            -> descarga y genera
//   node scripts/fetch-pistes.mjs --from f   -> usa un JSON de Overpass ya descargado
//
// Datos © colaboradores de OpenStreetMap, licencia ODbL.

import { writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

// Cajas [sur, oeste, norte, este]. No se solapan: una vía se asigna a la primera que la contiene.
export const ZONES = [
  { id: 'candanchu', name: 'Candanchú', bbox: [42.755, -0.575, 42.82, -0.522] },
  { id: 'astun', name: 'Astún', bbox: [42.785, -0.522, 42.84, -0.47] },
  { id: 'formigal', name: 'Formigal', bbox: [42.745, -0.46, 42.84, -0.32] },
  { id: 'panticosa', name: 'Panticosa', bbox: [42.69, -0.32, 42.75, -0.25] },
  { id: 'cerler', name: 'Cerler', bbox: [42.52, 0.48, 42.62, 0.63] },
]

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

const LIFT_TYPES = new Set([
  'cable_car', 'gondola', 'mixed_lift', 'chair_lift', 'drag_lift', 't-bar', 'j-bar',
  'platter', 'rope_tow', 'magic_carpet', 'zip_line',
])

const SIMPLIFY_M = 4

function query(z) {
  const b = z.bbox.join(',')
  return `[out:json][timeout:120];
(
  way["piste:type"="downhill"](${b});
  relation["piste:type"="downhill"](${b});
  way["aerialway"](${b});
);
out body geom;`
}

async function overpass(q) {
  let lastErr
  for (const url of ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'pistas-pirineo-zepp/1.0' },
          body: 'data=' + encodeURIComponent(q),
        })
        if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`)
        return await res.json()
      } catch (e) {
        lastErr = e
        console.warn(`  fallo ${url}: ${e.message}`)
        await new Promise((r) => setTimeout(r, 3000 * (attempt + 1)))
      }
    }
  }
  throw lastErr
}

// Douglas-Peucker sobre puntos [[x,y],...]
function simplify(pts, tol) {
  if (pts.length <= 2) return pts
  const keep = new Uint8Array(pts.length)
  keep[0] = keep[pts.length - 1] = 1
  const stack = [[0, pts.length - 1]]
  while (stack.length) {
    const [a, b] = stack.pop()
    let maxD = 0
    let idx = -1
    const [ax, ay] = pts[a]
    const [bx, by] = pts[b]
    const dx = bx - ax
    const dy = by - ay
    const len = Math.hypot(dx, dy)
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i]
      const d = len === 0 ? Math.hypot(px - ax, py - ay) : Math.abs(dy * px - dx * py + bx * ay - by * ax) / len
      if (d > maxD) {
        maxD = d
        idx = i
      }
    }
    if (maxD > tol && idx > 0) {
      keep[idx] = 1
      stack.push([a, idx], [idx, b])
    }
  }
  return pts.filter((_, i) => keep[i])
}

function encode(geom, lat0, lon0, closed) {
  const k = Math.cos((lat0 * Math.PI) / 180)
  let pts = geom.map((g) => [(g.lon - lon0) * 111320 * k, (g.lat - lat0) * 110574])
  if (closed && pts.length > 1) pts = pts.slice(0, -1) // el último repite el primero
  pts = simplify(pts, SIMPLIFY_M)
  const flat = []
  for (const [x, y] of pts) flat.push(Math.round(x), Math.round(y))
  return flat
}

function inBbox(g, bbox) {
  return g.lat >= bbox[0] && g.lon >= bbox[1] && g.lat <= bbox[2] && g.lon <= bbox[3]
}

function centroid(geom) {
  let la = 0
  let lo = 0
  for (const g of geom) {
    la += g.lat
    lo += g.lon
  }
  return { lat: la / geom.length, lon: lo / geom.length }
}

export function buildZone(zone, elements, taken) {
  const ways = elements.filter((e) => e.type === 'way' && e.geometry && e.geometry.length >= 2)
  const rels = elements.filter((e) => e.type === 'relation')

  // Nombre / ref / dificultad heredados de relaciones de pista.
  const inherited = new Map()
  for (const r of rels) {
    const t = r.tags || {}
    if (t['piste:type'] !== 'downhill') continue
    for (const m of r.members || []) {
      if (m.type !== 'way') continue
      const prev = inherited.get(m.ref) || {}
      inherited.set(m.ref, {
        n: prev.n || t['piste:name'] || t.name,
        r: prev.r || t['piste:ref'] || t.ref,
        d: prev.d || t['piste:difficulty'],
      })
    }
  }

  const pistes = []
  const lifts = []
  const used = []
  for (const w of ways) {
    const t = w.tags || {}
    const isPiste = t['piste:type'] === 'downhill'
    const isLift = LIFT_TYPES.has(t.aerialway)
    if (!isPiste && !isLift) continue
    const c = centroid(w.geometry)
    if (!inBbox(c, zone.bbox) || taken.has(w.id)) continue
    taken.add(w.id)
    used.push(w)
    if (isPiste) {
      const inh = inherited.get(w.id) || {}
      const first = w.geometry[0]
      const last = w.geometry[w.geometry.length - 1]
      const closed = first.lat === last.lat && first.lon === last.lon
      // Una pista cerrada en OSM es casi siempre un área (area=yes); las lineales no se cierran.
      const area = closed && t.area !== 'no' && w.geometry.length >= 4
      pistes.push({
        id: w.id,
        n: t['piste:name'] || t.name || inh.n || '',
        r: t['piste:ref'] || t.ref || inh.r || '',
        d: t['piste:difficulty'] || inh.d || '',
        a: area ? 1 : 0,
        geom: w.geometry,
      })
    } else {
      lifts.push({ id: w.id, n: t.name || t.ref || '', t: t.aerialway, geom: w.geometry })
    }
  }

  if (!used.length) return null
  // Origen = centro de las vías asignadas.
  let la = 0
  let lo = 0
  let n = 0
  for (const w of used) for (const g of w.geometry) (la += g.lat), (lo += g.lon), n++
  const lat0 = +(la / n).toFixed(6)
  const lon0 = +(lo / n).toFixed(6)

  const out = (f, extra) => {
    const o = { n: f.n }
    Object.assign(o, extra)
    return o
  }
  return {
    id: zone.id,
    name: zone.name,
    lat0,
    lon0,
    pistes: pistes.map((f) => {
      const o = out(f, {})
      if (f.r) o.r = f.r
      if (f.d) o.d = f.d
      if (f.a) o.a = 1
      o.p = encode(f.geom, lat0, lon0, f.a)
      return o
    }),
    lifts: lifts.map((f) => out(f, { t: f.t, p: encode(f.geom, lat0, lon0, false) })),
  }
}

export function renderModule(zones) {
  const stamp = new Date().toISOString().slice(0, 10)
  return (
    `// GENERADO por scripts/fetch-pistes.mjs el ${stamp}. No editar a mano.\n` +
    `// Datos © colaboradores de OpenStreetMap (ODbL) - https://www.openstreetmap.org/copyright\n` +
    `export const DATA_DATE = '${stamp}'\n` +
    `export const ZONES = ${JSON.stringify(zones)}\n`
  )
}

async function main() {
  const fromIdx = process.argv.indexOf('--from')
  const taken = new Set()
  const zones = []
  let cached = null
  if (fromIdx > 0) cached = JSON.parse(readFileSync(process.argv[fromIdx + 1], 'utf8'))

  for (const z of ZONES) {
    console.log(`Descargando ${z.name}...`)
    const data = cached || (await overpass(query(z)))
    const built = buildZone(z, data.elements || [], taken)
    if (!built) {
      console.warn(`  ${z.name}: sin datos`)
      continue
    }
    const sinNombre = built.pistes.filter((p) => !p.n && !p.r).length
    console.log(`  ${built.pistes.length} pistas (${sinNombre} sin nombre), ${built.lifts.length} remontes`)
    zones.push(built)
    if (!cached) await new Promise((r) => setTimeout(r, 2000)) // cortesía con Overpass
  }

  if (!zones.length) throw new Error('No se ha obtenido ninguna pista')
  const file = join(ROOT, 'data', 'pistes.js')
  mkdirSync(dirname(file), { recursive: true })
  const src = renderModule(zones)
  writeFileSync(file, src)
  console.log(`\nOK -> ${file} (${(src.length / 1024).toFixed(0)} KB)`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((e) => {
    console.error('\nERROR:', e.message)
    process.exit(1)
  })
}
