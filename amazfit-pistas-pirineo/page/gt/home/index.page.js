import * as hmUI from '@zos/ui'
import { getDeviceInfo } from '@zos/device'
import { Geolocation, Vibrator, VIBRATOR_SCENE_STRONG_REMINDER } from '@zos/sensor'
import { setPageBrightTime, pauseDropWristScreenOff, resetDropWristScreenOff, setWakeUpRelaunch } from '@zos/display'
import { onKey, offKey, KEY_UP, KEY_DOWN, KEY_EVENT_CLICK } from '@zos/interaction'
import { log as Logger } from '@zos/utils'
import { ZONES, DATA_DATE } from '../../../data/pistes'
import {
  project,
  buildIndex,
  queryIndex,
  nearestZone,
  createTracker,
  difficultyInfo,
  pisteLabel,
} from '../../../utils/geo'

const logger = Logger.getLogger('pistas-pirineo')
const { width: W, height: H } = getDeviceInfo()
const CX = W / 2
const CY = H / 2

// Metros por píxel de cada nivel de zoom (Cheetah Round: 454 px ≈ 0,9 / 1,8 / 3,6 / 7 km de ancho).
const ZOOMS = [2, 4, 8, 16]
const LIFT_COLOR = 0xdddddd
const ON_COLOR = 0x22cc55
const OFF_COLOR = 0xff2222
const IDLE_COLOR = 0x555555

let geo = null
let vibrator = null
let tracker = null
let ui = {}
let zone = null
let pisteIdx = null
let liftIdx = null
let zoomLevel = 1
let last = null // último fix { x, y, t }
let heading = null
let speedKmh = 0
let wasOff = false

function loadZone(z) {
  if (zone === z) return
  zone = z
  // Copias superficiales para que buildIndex pueda anotar los bbox sin tocar el módulo.
  pisteIdx = buildIndex(z.pistes.map((p) => Object.assign({}, p)))
  liftIdx = buildIndex(z.lifts.map((l) => Object.assign({}, l)))
  tracker = createTracker()
  last = null
  heading = null
  logger.log('zona ' + z.name + ': ' + z.pistes.length + ' pistas')
}

function text(props) {
  return hmUI.createWidget(
    hmUI.widget.TEXT,
    Object.assign(
      {
        color: 0xffffff,
        text_size: 26,
        align_h: hmUI.align.CENTER_H,
        align_v: hmUI.align.CENTER_V,
        text_style: hmUI.text_style.ELLIPSIS,
      },
      props,
    ),
  )
}

function setText(w, t, color) {
  const o = { text: t }
  if (color !== undefined) o.color = color
  w.setProperty(hmUI.prop.MORE, o)
}

function drawFeature(canvas, f, ox, oy, mpp, color, width) {
  const p = f.p
  const n = p.length
  const end = f.a ? n : n - 2
  for (let i = 0; i < end; i += 2) {
    const j = (i + 2) % n
    canvas.drawLine({
      x1: CX + (p[i] - ox) / mpp,
      y1: CY - (p[i + 1] - oy) / mpp,
      x2: CX + (p[j] - ox) / mpp,
      y2: CY - (p[j + 1] - oy) / mpp,
      color,
      line_width: width,
    })
  }
}

function render() {
  const c = ui.canvas
  c.clear({ x: 0, y: 0, w: W, h: H })
  if (!zone) return

  const mpp = ZOOMS[zoomLevel]
  const ox = last ? last.x : 0
  const oy = last ? last.y : 0
  const r = (W / 2) * mpp * 1.45
  const st = tracker ? tracker.state : {}

  const pistes = queryIndex(pisteIdx, ox, oy, r)
  for (let i = 0; i < pistes.length; i++) {
    const f = pistes[i]
    if (f === st.piste) continue
    drawFeature(c, f, ox, oy, mpp, difficultyInfo(f.d).color, mpp <= 4 ? 4 : 3)
  }
  const lifts = queryIndex(liftIdx, ox, oy, r)
  for (let i = 0; i < lifts.length; i++) drawFeature(c, lifts[i], ox, oy, mpp, LIFT_COLOR, 2)

  // Pista actual resaltada con borde blanco.
  if (st.piste) {
    drawFeature(c, st.piste, ox, oy, mpp, 0xffffff, 10)
    drawFeature(c, st.piste, ox, oy, mpp, difficultyInfo(st.piste.d).color, 6)
  }

  if (last) {
    const col = st.offPiste ? OFF_COLOR : 0xffffff
    c.drawCircle({ center_x: CX, center_y: CY, radius: 9, color: 0x000000 })
    c.drawCircle({ center_x: CX, center_y: CY, radius: 7, color: col })
    if (heading !== null) {
      const hx = Math.sin(heading)
      const hy = -Math.cos(heading)
      c.drawLine({ x1: CX + hx * 9, y1: CY + hy * 9, x2: CX + hx * 26, y2: CY + hy * 26, color: col, line_width: 4 })
    }
  }

  // Escala: lo que miden 50 px en el terreno
  setText(ui.scale, '50 px = ' + 50 * mpp + ' m')
}

function updateInfo() {
  const st = tracker ? tracker.state : null
  if (!ZONES.length) {
    setText(ui.title, 'Sin datos de pistas', 0xffffff)
    setText(ui.diff, 'Ejecuta: npm run datos', 0xbbbbbb)
    return
  }
  setText(ui.zone, zone ? zone.name : 'Pirineo aragonés')
  if (!last || !zone) {
    setText(ui.title, 'Buscando GPS...', 0xffffff)
    setText(ui.diff, 'Sal al aire libre', 0xbbbbbb)
    setText(ui.status, '', IDLE_COLOR)
    ui.ring.setProperty(hmUI.prop.MORE, { color: IDLE_COLOR })
    return
  }
  if (st.lift) {
    setText(ui.title, st.lift.n || 'Remonte', 0xffffff)
    setText(ui.diff, 'REMONTE', LIFT_COLOR)
  } else if (st.piste && st.offPiste) {
    const d = difficultyInfo(st.piste.d)
    setText(ui.title, 'Cerca: ' + pisteLabel(st.piste), 0xffffff)
    setText(ui.diff, 'Más cercana · ' + d.label, d.color)
  } else if (st.piste) {
    const d = difficultyInfo(st.piste.d)
    setText(ui.title, pisteLabel(st.piste), 0xffffff)
    setText(ui.diff, d.label, d.color)
  } else {
    setText(ui.title, 'Ninguna pista cerca', 0xffffff)
    setText(ui.diff, '', 0xffffff)
  }

  const speed = Math.round(speedKmh) + ' km/h'
  if (st.lift) {
    setText(ui.status, 'EN REMONTE · ' + speed, LIFT_COLOR)
    ui.ring.setProperty(hmUI.prop.MORE, { color: LIFT_COLOR })
  } else if (st.offPiste) {
    const d = st.distance === null ? '' : ' ' + Math.round(st.distance) + ' m'
    setText(ui.status, 'FUERA DE PISTA' + d, OFF_COLOR)
    ui.ring.setProperty(hmUI.prop.MORE, { color: OFF_COLOR })
  } else {
    setText(ui.status, 'EN PISTA · ' + speed, ON_COLOR)
    ui.ring.setProperty(hmUI.prop.MORE, { color: ON_COLOR })
  }

  if (st.offPiste && !wasOff && vibrator) {
    try {
      vibrator.stop()
      vibrator.setMode(VIBRATOR_SCENE_STRONG_REMINDER)
      vibrator.start()
    } catch (e) {
      logger.log('vibrator ' + e)
    }
  }
  wasOff = !!st.offPiste
}

function onGps() {
  if (!geo || geo.getStatus() !== 'A') return
  const lat = geo.getLatitude({ format: 'DD' })
  const lon = geo.getLongitude({ format: 'DD' })
  if (typeof lat !== 'number' || typeof lon !== 'number') return

  const nz = nearestZone(ZONES, lat, lon)
  if (nz) loadZone(nz.zone)
  const p = project(lat, lon, zone.lat0, zone.lon0)
  const now = Date.now()
  let ref = last
  if (ref) {
    const dx = p.x - ref.x
    const dy = p.y - ref.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const dt = (now - ref.t) / 1000
    if (dt < 0.5) {
      ref = null // fix demasiado seguido: no sirve para velocidad, conservamos la referencia
    } else {
      const v = (dist / dt) * 3.6
      if (v < 150) speedKmh = speedKmh * 0.5 + v * 0.5 // descarta saltos del GPS
      if (dist > 3) heading = Math.atan2(dx, dy) // 0 = norte, sentido horario
    }
  }
  last = ref === null && last ? { x: p.x, y: p.y, t: last.t } : { x: p.x, y: p.y, t: now }
  tracker.update(pisteIdx, liftIdx, p.x, p.y, 0)
  render()
  updateInfo()
}

function zoom(delta) {
  zoomLevel = Math.max(0, Math.min(ZOOMS.length - 1, zoomLevel + delta))
  render()
}

Page({
  build() {
    try {
      setPageBrightTime({ brightTime: 2147483000 })
      pauseDropWristScreenOff({ duration: 0 })
      setWakeUpRelaunch({ relaunch: true })
    } catch (e) {
      logger.log('display ' + e)
    }

    ui.canvas = hmUI.createWidget(hmUI.widget.CANVAS, { x: 0, y: 0, w: W, h: H })
    // Fondo negro bajo los textos para que se lean encima del mapa.
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 70, y: 40, w: W - 140, h: 96, radius: 20, color: 0x000000 })
    hmUI.createWidget(hmUI.widget.FILL_RECT, { x: 80, y: H - 118, w: W - 160, h: 78, radius: 20, color: 0x000000 })

    ui.zone = text({ x: 100, y: 42, w: W - 200, h: 24, text_size: 18, color: 0x9ad0ff, text: '' })
    ui.title = text({ x: 76, y: 64, w: W - 152, h: 40, text_size: 30, text: 'Cargando...' })
    ui.diff = text({ x: 90, y: 102, w: W - 180, h: 30, text_size: 22, text: '' })
    ui.status = text({ x: 84, y: H - 114, w: W - 168, h: 40, text_size: 26, text: '' })
    ui.scale = text({ x: 140, y: H - 76, w: W - 280, h: 28, text_size: 18, color: 0xaaaaaa, text: '' })

    // El anillo se crea después de los paneles para quedar por encima.
    ui.ring = hmUI.createWidget(hmUI.widget.ARC, {
      x: 4,
      y: 4,
      w: W - 8,
      h: H - 8,
      start_angle: 0,
      end_angle: 360,
      color: IDLE_COLOR,
      line_width: 10,
    })

    const btn = (x, label, delta) =>
      hmUI.createWidget(hmUI.widget.BUTTON, {
        x,
        y: CY - 32,
        w: 64,
        h: 64,
        radius: 32,
        normal_color: 0x222222,
        press_color: 0x555555,
        text: label,
        text_size: 36,
        click_func: () => zoom(delta),
      })
    btn(18, '-', 1)
    btn(W - 82, '+', -1)

    try {
      onKey({
        callback: (key, ev) => {
          if (ev !== KEY_EVENT_CLICK) return false
          if (key === KEY_UP) {
            zoom(-1)
            return true
          }
          if (key === KEY_DOWN) {
            zoom(1)
            return true
          }
          return false
        },
      })
    } catch (e) {
      logger.log('onKey ' + e)
    }

    try {
      vibrator = new Vibrator()
    } catch (e) {
      vibrator = null
    }
    geo = new Geolocation()
    geo.start()
    geo.onChange(onGps)
    updateInfo()
    logger.log('datos OSM ' + DATA_DATE)
  },

  onDestroy() {
    try {
      if (geo) {
        geo.offChange(onGps)
        geo.stop()
      }
      if (vibrator) vibrator.stop()
      offKey()
      resetDropWristScreenOff()
    } catch (e) {
      logger.log('destroy ' + e)
    }
  },
})
