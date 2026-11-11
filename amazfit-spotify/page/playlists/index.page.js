import { BasePage } from '@zeppos/zml/base-page'
import { push } from '@zos/router'
import { text, button, remove, toast, errMsg } from '../ui'

const ROW = 90

Page(
  BasePage({
    state: { y: 110, more: null, loading: false },

    build() {
      text({ y: 30, h: 60, size: 32, text: 'Mis listas' })
      this.wLoading = text({ y: 110, h: 50, size: 24, color: 0xaaaaaa, text: 'Cargando…' })
      this.load(0)
    },

    load(offset) {
      if (this.state.loading) return
      this.state.loading = true
      this.request({ method: 'PLAYLISTS', params: { offset } })
        .then((r) => {
          remove(this.wLoading); this.wLoading = null
          remove(this.state.more); this.state.more = null
          if (!r.items.length && offset === 0) {
            text({ y: this.state.y, h: 80, size: 24, wrap: true, text: 'No tienes listas' })
            return
          }
          r.items.forEach((p) => {
            button({ y: this.state.y, text: p.name,
              onClick: () => push({ url: 'page/tracks/index.page', params: JSON.stringify({ id: p.id, name: p.name }) }) })
            this.state.y += ROW
          })
          if (r.next != null) {
            this.state.more = button({ x: 140, y: this.state.y, w: 200, h: 64, text: 'Más…', onClick: () => this.load(r.next) })
          }
          // margen final para que la última fila no quede cortada por el borde redondo
          text({ y: this.state.y + ROW, h: 60, text: '' })
        })
        .catch((e) => {
          if (this.wLoading) remove(this.wLoading)
          this.wLoading = text({ y: 110, h: 120, size: 24, wrap: true, text: errMsg(e) })
          toast(errMsg(e))
        })
        .finally(() => { this.state.loading = false })
    },
  }),
)
