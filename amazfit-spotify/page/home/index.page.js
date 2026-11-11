import { BasePage } from '@zeppos/zml/base-page'
import { push } from '@zos/router'
import { text, button, setText, toast, errMsg, GREEN } from '../ui'

Page(
  BasePage({
    state: { timer: null, busy: false },

    build() {
      this.wTitle = text({ y: 60, h: 64, size: 30, wrap: true, text: 'Conectando…' })
      this.wArtist = text({ y: 128, h: 40, size: 24, color: 0xaaaaaa })
      this.wInfo = text({ y: 172, h: 36, size: 20, color: 0x777777 })

      button({ x: 50, y: 220, w: 115, h: 90, text: '|<<', size: 32, onClick: () => this.act('PREV') })
      this.wPlay = button({ x: 182, y: 212, w: 116, h: 106, radius: 53, text: '>', size: 40, bg: GREEN, color: 0x000000, onClick: () => this.act('TOGGLE') })
      button({ x: 315, y: 220, w: 115, h: 90, text: '>>|', size: 32, onClick: () => this.act('NEXT') })

      button({ x: 70, y: 330, w: 105, h: 64, text: 'Vol -', size: 24, onClick: () => this.act('VOLUME', { delta: -10 }) })
      this.wShuffle = button({ x: 188, y: 330, w: 104, h: 64, text: 'Aleat.', size: 22, onClick: () => this.act('SHUFFLE') })
      button({ x: 305, y: 330, w: 105, h: 64, text: 'Vol +', size: 24, onClick: () => this.act('VOLUME', { delta: 10 }) })

      button({ x: 120, y: 405, w: 240, h: 60, text: 'Mis listas', size: 26, bg: GREEN, color: 0x000000,
        onClick: () => push({ url: 'page/playlists/index.page' }) })

      this.refresh()
      this.state.timer = setInterval(() => this.refresh(), 8000)
    },

    refresh() {
      this.request({ method: 'STATE' })
        .then((s) => this.render(s))
        .catch((e) => {
          setText(this.wTitle, 'Spoti Mando')
          setText(this.wArtist, '')
          setText(this.wInfo, errMsg(e))
        })
    },

    render(s) {
      if (s.idle) {
        setText(this.wTitle, 'Nada sonando')
        setText(this.wArtist, 'Elige una lista')
        setText(this.wInfo, '')
      } else {
        setText(this.wTitle, s.title)
        setText(this.wArtist, s.artist)
        setText(this.wInfo, s.volume != null && s.canVolume ? 'Vol ' + s.volume + '%' : '')
      }
      setText(this.wPlay, s.playing ? '||' : '>')
      setText(this.wShuffle, s.shuffle ? 'Aleat. ✓' : 'Aleat.')
    },

    act(method, params) {
      if (this.state.busy) return
      this.state.busy = true
      this.request({ method, params: params || {} })
        .then((r) => {
          if (method === 'VOLUME' && r && r.volume != null) setText(this.wInfo, 'Vol ' + r.volume + '%')
          // Spotify tarda un poco en reflejar el cambio
          setTimeout(() => this.refresh(), 700)
        })
        .catch((e) => toast(errMsg(e)))
        .finally(() => { this.state.busy = false })
    },

    onResume() {
      this.refresh()
    },

    onDestroy() {
      if (this.state.timer) clearInterval(this.state.timer)
    },
  }),
)
