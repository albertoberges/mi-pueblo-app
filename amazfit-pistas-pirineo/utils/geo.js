// Lógica geográfica pura (sin APIs de Zepp OS) para poder probarla en Node.
//
// Formato de datos (generado por scripts/fetch-pistes.mjs):
//   zone = { id, name, lat0, lon0, pistes: [...], lifts: [...] }
//   piste = { n: nombre, r: ref, d: dificultad, a: 1 si es área, p: [x0,y0,x1,y1,...] }
//   lift  = { n: nombre, t: tipo, p: [x0,y0,...] }
// Las coordenadas x/y son metros enteros respecto a (lat0, lon0): x = Este, y = Norte.

export const M_PER_DEG_LAT = 110574
export const M_PER_DEG_LON_EQ = 111320

export function project(lat, lon, lat0, lon0) {
  const k = Math.cos((lat0 * Math.PI) / 180)
  return {
    x: (lon - lon0) * M_PER_DEG_LON_EQ * k,
    y: (lat - lat0) * M_PER_DEG_LAT,
  }
}

export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = Math.PI / 180
  const dLat = (lat2 - lat1) * toRad
  const dLon = (lon2 - lon1) * toRad
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return 2 * R * Math.asin(Math.sqrt(a))
}

// Distancia del punto (px,py) al segmento (ax,ay)-(bx,by).
export function pointSegmentDistance(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const len2 = dx * dx + dy * dy
  let t = len2 > 0 ? ((px - ax) * dx + (py - ay) * dy) / len2 : 0
  if (t < 0) t = 0
  else if (t > 1) t = 1
  const cx = ax + t * dx - px
  const cy = ay + t * dy - py
  return Math.sqrt(cx * cx + cy * cy)
}

// Ray casting sobre un anillo plano [x0,y0,x1,y1,...].
export function pointInRing(px, py, p) {
  let inside = false
  const n = p.length / 2
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = p[i * 2]
    const yi = p[i * 2 + 1]
    const xj = p[j * 2]
    const yj = p[j * 2 + 1]
    if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// Distancia mínima a una polilínea (o al borde de un área).
export function distanceToFeature(px, py, f) {
  const p = f.p
  if (f.a && pointInRing(px, py, p)) return 0
  let best = Infinity
  const last = f.a ? p.length : p.length - 2
  for (let i = 0; i < last; i += 2) {
    const j = (i + 2) % p.length
    const d = pointSegmentDistance(px, py, p[i], p[i + 1], p[j], p[j + 1])
    if (d < best) best = d
  }
  return best
}

// Rejilla espacial para no recorrer todas las pistas en cada fix GPS.
export function buildIndex(features, cell) {
  const size = cell || 150
  const grid = {}
  for (let k = 0; k < features.length; k++) {
    const p = features[k].p
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (let i = 0; i < p.length; i += 2) {
      if (p[i] < minX) minX = p[i]
      if (p[i] > maxX) maxX = p[i]
      if (p[i + 1] < minY) minY = p[i + 1]
      if (p[i + 1] > maxY) maxY = p[i + 1]
    }
    features[k].bb = [minX, minY, maxX, maxY]
    for (let gx = Math.floor(minX / size); gx <= Math.floor(maxX / size); gx++) {
      for (let gy = Math.floor(minY / size); gy <= Math.floor(maxY / size); gy++) {
        const key = gx + ',' + gy
        if (!grid[key]) grid[key] = []
        grid[key].push(k)
      }
    }
  }
  return { size, grid, features }
}

// Devuelve las features cuyas celdas tocan el círculo de radio r alrededor de (x,y).
export function queryIndex(index, x, y, r) {
  const s = index.size
  const seen = {}
  const out = []
  for (let gx = Math.floor((x - r) / s); gx <= Math.floor((x + r) / s); gx++) {
    for (let gy = Math.floor((y - r) / s); gy <= Math.floor((y + r) / s); gy++) {
      const list = index.grid[gx + ',' + gy]
      if (!list) continue
      for (let i = 0; i < list.length; i++) {
        const k = list[i]
        if (!seen[k]) {
          seen[k] = true
          out.push(index.features[k])
        }
      }
    }
  }
  return out
}

export function nearest(index, x, y, radius) {
  const cands = queryIndex(index, x, y, radius)
  let best = null
  let bestD = Infinity
  for (let i = 0; i < cands.length; i++) {
    const d = distanceToFeature(x, y, cands[i])
    if (d < bestD) {
      bestD = d
      best = cands[i]
    }
  }
  return best && bestD <= radius ? { feature: best, distance: bestD } : null
}

export function nearestZone(zones, lat, lon) {
  let best = null
  let bestD = Infinity
  for (let i = 0; i < zones.length; i++) {
    const d = distanceMeters(lat, lon, zones[i].lat0, zones[i].lon0)
    if (d < bestD) {
      bestD = d
      best = zones[i]
    }
  }
  return best ? { zone: best, distance: bestD } : null
}

export const DIFFICULTY = {
  novice: { label: 'VERDE', color: 0x2ecc40 },
  easy: { label: 'AZUL', color: 0x1e7bff },
  intermediate: { label: 'ROJA', color: 0xff3030 },
  advanced: { label: 'NEGRA', color: 0x9a9a9a },
  expert: { label: 'NEGRA+', color: 0x9a9a9a },
  freeride: { label: 'FREERIDE', color: 0xff9900 },
  extreme: { label: 'EXTREMA', color: 0xff9900 },
}

export function difficultyInfo(d) {
  return DIFFICULTY[d] || { label: 'SIN CLASIF.', color: 0xbbbbbb }
}

export function pisteLabel(f) {
  if (f.n && f.r && f.n.indexOf(f.r) === -1) return f.r + ' · ' + f.n
  return f.n || (f.r ? 'Pista ' + f.r : 'Pista sin nombre')
}

// Seguimiento con histéresis para no parpadear entre "en pista" y "fuera"
// por el ruido del GPS (normalmente ±5-15 m en montaña).
//   onDist:  por debajo de esto estás en pista (0 m dentro de áreas)
//   offDist: por encima de esto cuenta como fuera
//   offFixes: fixes consecutivos fuera antes de avisar
export function createTracker(opts) {
  const o = Object.assign({ onDist: 30, offDist: 45, offFixes: 3, liftDist: 15, searchRadius: 400 }, opts || {})
  const state = { piste: null, distance: null, offPiste: false, offCount: 0, lift: null }

  return {
    state,
    update(pisteIndex, liftIndex, x, y, accuracy) {
      const acc = accuracy > 0 ? Math.min(accuracy, 30) : 0
      const onDist = o.onDist + acc * 0.5
      const offDist = o.offDist + acc * 0.5

      const np = nearest(pisteIndex, x, y, o.searchRadius)
      // Preferir la pista actual si sigue siendo plausible (evita saltos en cruces).
      let chosen = np
      if (np && state.piste && np.feature !== state.piste) {
        const dCur = distanceToFeature(x, y, state.piste)
        if (dCur <= onDist && dCur - np.distance < 10) chosen = { feature: state.piste, distance: dCur }
      }

      const nl = liftIndex ? nearest(liftIndex, x, y, o.liftDist) : null
      state.lift = nl && (!chosen || nl.distance < chosen.distance) ? nl.feature : null

      state.piste = chosen ? chosen.feature : null
      state.distance = chosen ? chosen.distance : null

      const dist = chosen ? chosen.distance : Infinity
      if (state.lift) {
        state.offCount = 0
        state.offPiste = false
      } else if (dist <= onDist) {
        state.offCount = 0
        state.offPiste = false
      } else if (dist > offDist) {
        state.offCount++
        if (state.offCount >= o.offFixes) state.offPiste = true
      }
      return state
    },
  }
}
