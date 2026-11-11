import { createWidget, deleteWidget, widget, align, text_style, prop } from '@zos/ui'
import { px } from '@zos/utils'
import { showToast } from '@zos/interaction'

export const GREEN = 0x1db954
export const DARK = 0x222222
export const PRESS = 0x444444

export function text(opts) {
  return createWidget(widget.TEXT, {
    x: px(opts.x != null ? opts.x : 40),
    y: px(opts.y),
    w: px(opts.w || 400),
    h: px(opts.h || 50),
    text: opts.text || '',
    text_size: px(opts.size || 26),
    color: opts.color != null ? opts.color : 0xffffff,
    align_h: align.CENTER_H,
    align_v: align.CENTER_V,
    text_style: opts.wrap ? text_style.WRAP : text_style.ELLIPSIS,
  })
}

export function button(opts) {
  return createWidget(widget.BUTTON, {
    x: px(opts.x != null ? opts.x : 60),
    y: px(opts.y),
    w: px(opts.w || 360),
    h: px(opts.h || 76),
    radius: px(opts.radius != null ? opts.radius : 38),
    text: opts.text,
    text_size: px(opts.size || 26),
    color: opts.color != null ? opts.color : 0xffffff,
    normal_color: opts.bg != null ? opts.bg : DARK,
    press_color: PRESS,
    click_func: opts.onClick,
  })
}

export function setText(w, t) {
  if (w) w.setProperty(prop.MORE, { text: t })
}

export function remove(w) {
  if (w) deleteWidget(w)
}

export function toast(t) {
  showToast({ content: t })
}

export function errMsg(e) {
  return (e && (e.message || e.code)) || 'Sin conexión con el móvil'
}
