// Servicio lateral: corre DENTRO de la app Zepp del iPhone y habla con la
// API web de Spotify. El reloj nunca toca internet: le pide cosas a este
// servicio por Bluetooth (ZML request/response).
import { BaseSideService } from '@zeppos/zml/base-side'
import { REDIRECT_URI, formEncode, extractCode } from '../shared/spotify-auth'

const API = 'https://api.spotify.com/v1'
const TOKEN_URL = 'https://accounts.spotify.com/api/token'
const PAGE = 15

function parseBody(res) {
  if (!res || res.body == null || res.body === '') return null
  if (typeof res.body === 'string') {
    try { return JSON.parse(res.body) } catch (e) { return null }
  }
  return res.body
}

function cut(s, n) {
  s = s || ''
  return s.length > n ? s.slice(0, n - 1) + '…' : s
}

class SpotifyError extends Error {
  constructor(code, message) { super(message); this.code = code }
}

AppSideService(
  BaseSideService({
    onInit() {},

    onSettingsChange({ key }) {
      if (key === 'authRedirect') this.exchangeCode().catch(() => {})
    },

    // ---------- autenticación ----------
    get(key) { return this.settings.getItem(key) },
    set(key, v) { this.settings.setItem(key, v) },
    status(msg) { this.set('authStatus', msg) },

    async tokenRequest(params) {
      const res = await this.fetch({
        url: TOKEN_URL,
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formEncode(params),
      })
      const data = parseBody(res)
      if (res.status !== 200 || !data || !data.access_token) {
        throw new SpotifyError('AUTH', (data && (data.error_description || data.error)) || 'HTTP ' + res.status)
      }
      const prev = this.readTokens()
      const tokens = {
        access: data.access_token,
        refresh: data.refresh_token || (prev && prev.refresh),
        exp: Date.now() + (data.expires_in - 60) * 1000,
      }
      this.set('tokens', JSON.stringify(tokens))
      return tokens
    },

    readTokens() {
      try { return JSON.parse(this.get('tokens') || 'null') } catch (e) { return null }
    },

    async exchangeCode() {
      const code = extractCode(this.get('authRedirect'))
      const verifier = this.get('verifier')
      const clientId = (this.get('clientId') || '').trim()
      if (!code || !verifier || !clientId) return null
      if (this.get('usedCode') === code) return null
      this.set('usedCode', code)
      try {
        const t = await this.tokenRequest({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
          client_id: clientId,
          code_verifier: verifier,
        })
        this.status('✅ Conectado a Spotify')
        return t
      } catch (e) {
        this.status('❌ No se pudo conectar: ' + e.message + '. Genera un enlace nuevo y repite.')
        throw e
      }
    },

    async accessToken() {
      let t = this.readTokens()
      if (!t) t = await this.exchangeCode()
      if (!t) throw new SpotifyError('NO_AUTH', 'Abre Ajustes en la app Zepp y conecta Spotify')
      if (Date.now() < t.exp) return t.access
      const nt = await this.tokenRequest({
        grant_type: 'refresh_token',
        refresh_token: t.refresh,
        client_id: (this.get('clientId') || '').trim(),
      })
      return nt.access
    },

    // ---------- API ----------
    async api(method, path, body, retried) {
      const token = await this.accessToken()
      const headers = { Authorization: 'Bearer ' + token }
      if (body) headers['Content-Type'] = 'application/json'
      const res = await this.fetch({
        url: path.indexOf('http') === 0 ? path : API + path,
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      })
      if (res.status === 401 && !retried) {
        const t = this.readTokens()
        if (t) { t.exp = 0; this.set('tokens', JSON.stringify(t)) }
        return this.api(method, path, body, true)
      }
      const data = parseBody(res)
      if (res.status >= 400) {
        const msg = (data && data.error && (data.error.message || data.error)) || 'HTTP ' + res.status
        const reason = data && data.error && data.error.reason
        if (res.status === 404 && (reason === 'NO_ACTIVE_DEVICE' || /device/i.test(msg))) {
          throw new SpotifyError('NO_DEVICE', 'Abre Spotify en el iPhone y pon algo una vez')
        }
        if (res.status === 403 && reason === 'PREMIUM_REQUIRED') {
          throw new SpotifyError('PREMIUM', 'Hace falta Spotify Premium')
        }
        throw new SpotifyError(String(res.status), String(msg))
      }
      return data
    },

    // Si no hay dispositivo activo, despierta el primero disponible (el iPhone).
    async withDevice(fn) {
      try {
        return await fn(null)
      } catch (e) {
        if (e.code !== 'NO_DEVICE') throw e
        const d = await this.api('GET', '/me/player/devices')
        const dev = d && d.devices && (d.devices.find((x) => x.type === 'Smartphone') || d.devices[0])
        if (!dev) throw e
        return fn(dev.id)
      }
    },

    async state() {
      const p = await this.api('GET', '/me/player')
      if (!p || !p.item) return { idle: true, playing: false }
      const it = p.item
      return {
        idle: false,
        playing: !!p.is_playing,
        title: cut(it.name, 60),
        artist: cut((it.artists || []).map((a) => a.name).join(', ') || (it.show && it.show.name), 60),
        volume: p.device ? p.device.volume_percent : null,
        canVolume: p.device ? p.device.supports_volume !== false : false,
        shuffle: !!p.shuffle_state,
      }
    },

    async playlists(offset) {
      const d = await this.api('GET', `/me/playlists?limit=${PAGE}&offset=${offset || 0}`)
      return {
        items: (d.items || []).filter(Boolean).map((p) => ({ id: p.id, name: cut(p.name, 40) })),
        next: d.next ? (offset || 0) + PAGE : null,
      }
    },

    async tracks(id, offset) {
      // Desde 2026 Spotify usa /items y solo permite leer listas propias o colaborativas.
      let d
      try {
        d = await this.api('GET', `/playlists/${id}/items?limit=${PAGE}&offset=${offset || 0}`)
      } catch (e) {
        if (e.code === '403' || e.code === '404') return { items: [], next: null, locked: true }
        throw e
      }
      const items = []
      ;(d.items || []).forEach((row, i) => {
        const t = row && (row.item || row.track)
        if (!t || !t.name) return
        items.push({
          pos: (offset || 0) + i,
          name: cut(t.name, 34),
          artist: cut((t.artists || []).map((a) => a.name).join(', '), 30),
        })
      })
      return { items, next: d.next ? (offset || 0) + PAGE : null, locked: false }
    },

    async play(body) {
      return this.withDevice((deviceId) =>
        this.api('PUT', '/me/player/play' + (deviceId ? '?device_id=' + deviceId : ''), body),
      )
    },

    async handle(method, p) {
      switch (method) {
        case 'STATE': return this.state()
        case 'TOGGLE': {
          const s = await this.state()
          if (s.playing) await this.api('PUT', '/me/player/pause')
          else await this.play(null)
          return { ok: true }
        }
        case 'NEXT': await this.withDevice(() => this.api('POST', '/me/player/next')); return { ok: true }
        case 'PREV': await this.withDevice(() => this.api('POST', '/me/player/previous')); return { ok: true }
        case 'SHUFFLE': {
          const s = await this.state()
          await this.api('PUT', '/me/player/shuffle?state=' + (!s.shuffle))
          return { ok: true, shuffle: !s.shuffle }
        }
        case 'VOLUME': {
          const s = await this.state()
          const v = Math.max(0, Math.min(100, (s.volume || 50) + (p.delta || 0)))
          await this.api('PUT', '/me/player/volume?volume_percent=' + v)
          return { ok: true, volume: v }
        }
        case 'PLAYLISTS': return this.playlists(p.offset)
        case 'TRACKS': return this.tracks(p.id, p.offset)
        case 'PLAY_PLAYLIST': await this.play({ context_uri: 'spotify:playlist:' + p.id }); return { ok: true }
        case 'PLAY_TRACK':
          await this.play({ context_uri: 'spotify:playlist:' + p.id, offset: { position: p.pos } })
          return { ok: true }
        default: throw new SpotifyError('BAD_METHOD', 'Método desconocido')
      }
    },

    onRequest(req, res) {
      this.handle(req.method, req.params || {})
        .then((data) => res(null, data))
        .catch((e) => res({ code: e.code || 'ERR', message: e.message || String(e) }))
    },
  }),
)
