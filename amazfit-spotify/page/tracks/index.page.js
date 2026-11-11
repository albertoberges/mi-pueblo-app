import { BasePage } from '@zeppos/zml/base-page'
import { back } from '@zos/router'
import { text, button, remove, toast, errMsg, GREEN } from '../ui'

const ROW = 90

Page(
  BasePage({
    state: { id: '', name: '', y: 200, more: null, loading: false },

    onInit(params) {
      try {
        const p = JSON.parse(params || '{}')
        this.state.id = p.id
        this.state.name = p.name || ''
      } catch (e) {}
    },

    build() {
      text({ y: 30, h: 60, size: 28, text: this.state.name })
      button({ y: 100, text: '> Reproducir lista', bg: GREEN, color: 0x000000,
        onClick: () => this.play('PLAY_PLAYLIST', { id: this.state.id }) })
      this.wLoading = text({ y: 200, h: 50, size: 24, color: 0xaaaaaa, text: 'Cargando canciones…' })
      this.load(0)
    },

    play(method, params) {
      this.request({ method, params })
        .then(() => { toast('Reproduciendo'); back() })
        .catch((e) => toast(errMsg(e)))
    },

    load(offset) {
      if (this.state.loading) return
      this.state.loading = true
      this.request({ method: 'TRACKS', params: { id: this.state.id, offset } })
        .then((r) => {
          remove(this.wLoading); this.wLoading = null
          remove(this.state.more); this.state.more = null
          if (r.locked) {
            text({ y: this.state.y, h: 150, size: 22, wrap: true, color: 0xaaaaaa,
              text: 'Spotify no deja ver las canciones de listas que no son tuyas. Puedes reproducirla entera.' })
            return
          }
          r.items.forEach((t) => {
            button({ y: this.state.y, text: t.artist ? t.name + ' · ' + t.artist : t.name, size: 22,
              onClick: () => this.play('PLAY_TRACK', { id: this.state.id, pos: t.pos }) })
            this.state.y += ROW
          })
          if (r.next != null) {
            this.state.more = button({ x: 140, y: this.state.y, w: 200, h: 64, text: 'Más…', onClick: () => this.load(r.next) })
          }
          text({ y: this.state.y + ROW, h: 60, text: '' })
        })
        .catch((e) => {
          if (this.wLoading) remove(this.wLoading)
          this.wLoading = text({ y: 200, h: 120, size: 24, wrap: true, text: errMsg(e) })
        })
        .finally(() => { this.state.loading = false })
    },
  }),
)
