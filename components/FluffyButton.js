import { useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import styles from '../styles/FluffyButton.module.css'

/* ─── Canvas drawing helpers ────────────────────────────────────────── */
function hexToRgb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}
function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)) }

function isInRR(px, py, W, H, R) {
  if (px < 0 || px > W || py < 0 || py > H) return false
  const corners = [[R, R], [W - R, R], [R, H - R], [W - R, H - R]]
  for (const [cx, cy] of corners) {
    if (px >= cx - R && px <= cx + R && py >= cy - R && py <= cy + R) {
      const dx = px - cx, dy = py - cy
      if (dx * dx + dy * dy > R * R) return false
    }
  }
  return true
}

function getPerimPt(t, W, H, R) {
  const sX = W - 2 * R, sY = H - 2 * R, aL = 0.5 * Math.PI * R
  const total = 2 * (sX + sY) + 4 * aL
  let d = t * total
  const segs = [
    { type: 'l', len: sX, x0: R, y0: 0, dx: 1, dy: 0, nx: 0, ny: -1 },
    { type: 'a', len: aL, cx: W - R, cy: R, s: -Math.PI / 2 },
    { type: 'l', len: sY, x0: W, y0: R, dx: 0, dy: 1, nx: 1, ny: 0 },
    { type: 'a', len: aL, cx: W - R, cy: H - R, s: 0 },
    { type: 'l', len: sX, x0: W - R, y0: H, dx: -1, dy: 0, nx: 0, ny: 1 },
    { type: 'a', len: aL, cx: R, cy: H - R, s: Math.PI / 2 },
    { type: 'l', len: sY, x0: 0, y0: H - R, dx: 0, dy: -1, nx: -1, ny: 0 },
    { type: 'a', len: aL, cx: R, cy: R, s: Math.PI },
  ]
  for (const seg of segs) {
    if (d <= seg.len) {
      const f = d / seg.len
      if (seg.type === 'l') return { x: seg.x0 + seg.dx * d, y: seg.y0 + seg.dy * d, nx: seg.nx, ny: seg.ny }
      const angle = seg.s + f * Math.PI / 2
      return { x: seg.cx + Math.cos(angle) * R, y: seg.cy + Math.sin(angle) * R, nx: Math.cos(angle), ny: Math.sin(angle) }
    }
    d -= seg.len
  }
  return { x: R, y: 0, nx: 0, ny: -1 }
}

function drawFluffy(canvas, opts = {}) {
  const { color = '#E8601A', color2 = null, radius = null, strands = 2000, strandLen = 9, isFull = false } = opts
  const dpr = window.devicePixelRatio || 1
  const W0 = canvas.width, H0 = canvas.height
  canvas.width = W0 * dpr
  canvas.height = H0 * dpr
  canvas.style.width = isFull ? '100%' : W0 + 'px'
  canvas.style.height = H0 + 'px'
  const ctx = canvas.getContext('2d')
  ctx.scale(dpr, dpr)
  const W = W0, H = H0
  const R = radius !== null ? radius : H / 2

  const [r1, g1, b1] = hexToRgb(color)
  const hi = color2 ? hexToRgb(color2) : [Math.min(255, r1 + 55), Math.min(255, g1 + 40), Math.min(255, b1 + 25)]
  const sh = [Math.max(0, r1 - 55), Math.max(0, g1 - 40), Math.max(0, b1 - 30)]

  function rrPath() {
    ctx.beginPath()
    ctx.moveTo(R, 0)
    ctx.lineTo(W - R, 0)
    ctx.quadraticCurveTo(W, 0, W, R)
    ctx.lineTo(W, H - R)
    ctx.quadraticCurveTo(W, H, W - R, H)
    ctx.lineTo(R, H)
    ctx.quadraticCurveTo(0, H, 0, H - R)
    ctx.lineTo(0, R)
    ctx.quadraticCurveTo(0, 0, R, 0)
    ctx.closePath()
  }

  ctx.save()
  rrPath()
  ctx.clip()

  // Base gradient
  const grd = ctx.createLinearGradient(0, 0, 0, H)
  grd.addColorStop(0, `rgb(${Math.min(255, r1 + 35)},${Math.min(255, g1 + 22)},${Math.min(255, b1 + 12)})`)
  grd.addColorStop(0.45, `rgb(${r1},${g1},${b1})`)
  grd.addColorStop(1, `rgb(${Math.max(0, r1 - 35)},${Math.max(0, g1 - 22)},${Math.max(0, b1 - 12)})`)
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, W, H)

  // Body fur strands
  for (let i = 0; i < strands; i++) {
    let sx, sy, att = 0
    do { sx = Math.random() * W; sy = Math.random() * H; att++ }
    while (!isInRR(sx, sy, W, H, R) && att < 10)
    if (att >= 10) continue
    const vt = sy / H, ht = sx / W
    const blend = vt * 0.55 + ht * 0.15
    const rc = lerp(hi[0], sh[0], blend)
    const gc = lerp(hi[1], sh[1], blend)
    const bc = lerp(hi[2], sh[2], blend)
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85
    const len = strandLen * (0.35 + Math.random() * 0.85)
    const curl = (Math.random() - 0.5) * 0.7
    const ex = sx + Math.cos(angle + curl) * len
    const ey = sy + Math.sin(angle + curl) * len
    const mx = (sx + ex) / 2 + (Math.random() - 0.5) * 2.5
    const my = (sy + ey) / 2 + (Math.random() - 0.5) * 2.5
    const alpha = 0.28 + Math.random() * 0.6
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.quadraticCurveTo(mx, my, ex, ey)
    ctx.strokeStyle = `rgba(${Math.round(rc)},${Math.round(gc)},${Math.round(bc)},${alpha})`
    ctx.lineWidth = 0.55 + Math.random() * 0.95
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // Edge fringe strands
  const edgeN = Math.round(strands * 0.35)
  for (let i = 0; i < edgeN; i++) {
    const { x: px, y: py, nx, ny } = getPerimPt(i / edgeN, W, H, R)
    const angle = Math.atan2(ny, nx) + Math.PI + (Math.random() - 0.5) * 0.55
    const len = 3.5 + Math.random() * 7
    const ex2 = px + Math.cos(angle) * len
    const ey2 = py + Math.sin(angle) * len
    const vt = py / H
    const rc = lerp(hi[0], sh[0], vt * 0.5)
    const gc = lerp(hi[1], sh[1], vt * 0.5)
    const bc = lerp(hi[2], sh[2], vt * 0.5)
    ctx.beginPath()
    ctx.moveTo(px, py)
    ctx.lineTo(ex2, ey2)
    ctx.strokeStyle = `rgba(${Math.round(rc)},${Math.round(gc)},${Math.round(bc)},${0.45 + Math.random() * 0.55})`
    ctx.lineWidth = 0.65 + Math.random() * 0.85
    ctx.lineCap = 'round'
    ctx.stroke()
  }

  // Specular sheen
  const sheen = ctx.createRadialGradient(W * 0.28, H * 0.22, 0, W * 0.28, H * 0.22, W * 0.52)
  sheen.addColorStop(0, 'rgba(255,255,255,0.16)')
  sheen.addColorStop(0.45, 'rgba(255,255,255,0.05)')
  sheen.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = sheen
  ctx.fillRect(0, 0, W, H)

  // Depth shadow
  const depth = ctx.createLinearGradient(0, H * 0.55, 0, H)
  depth.addColorStop(0, 'rgba(0,0,0,0)')
  depth.addColorStop(1, 'rgba(0,0,0,0.22)')
  ctx.fillStyle = depth
  ctx.fillRect(0, 0, W, H)

  ctx.restore()

  // Drop shadow on parent
  const ds = `rgba(${Math.max(0, r1 - 65)},${Math.max(0, g1 - 45)},${Math.max(0, b1 - 35)},0.85)`
  canvas.parentElement.style.filter = `drop-shadow(0 7px 0 ${ds}) drop-shadow(0 13px 22px rgba(${r1},${g1},${b1},0.45))`
}

/* ─── React component ───────────────────────────────────────────────── */
export default function FluffyButton({
  label,
  color = '#E8601A',
  color2 = null,
  radius = null,
  strands = 2000,
  strandLen = 9,
  width = 200,
  height = 54,
  fontSize = 15,
  href,
  onClick,
  type,            // 'submit' | 'button' | 'reset'  →  renders as <button>
  disabled = false,
  fullWidth = false,
  float = false,
  floatDelay = '0s',
  style = {},
}) {
  const canvasRef = useRef(null)
  const wrapRef   = useRef(null)
  const router    = useRouter()

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap   = wrapRef.current
    if (!canvas || !wrap) return

    if (fullWidth) {
      const redraw = (w) => {
        if (w <= 0) return
        canvas.width  = w
        canvas.height = height
        drawFluffy(canvas, {
          color, color2, radius,
          strands: Math.round(strands * (w / 280)),
          strandLen,
          isFull: true,
        })
      }
      const obs = new ResizeObserver(entries => {
        for (const entry of entries) redraw(Math.round(entry.contentRect.width))
      })
      obs.observe(wrap)
      return () => obs.disconnect()
    } else {
      canvas.width  = width
      canvas.height = height
      drawFluffy(canvas, { color, color2, radius, strands, strandLen })
    }
  }, [color, color2, radius, strands, strandLen, width, height, fullWidth])

  const handleClick = () => {
    if (disabled) return
    if (href)     router.push(href)
    if (onClick)  onClick()
  }

  const El = type ? 'button' : 'div'

  return (
    <El
      ref={wrapRef}
      type={type}
      disabled={type ? disabled : undefined}
      onClick={type ? undefined : handleClick}
      className={[
        styles.fluffyWrap,
        float    ? styles.fluffyFloat    : '',
        disabled ? styles.fluffyDisabled : '',
      ].join(' ')}
      style={{
        '--float-delay': floatDelay,
        cursor: disabled ? 'not-allowed' : 'pointer',
        ...(fullWidth && { display: 'block', width: '100%' }),
        ...style,
      }}
    >
      <canvas ref={canvasRef} width={width} height={height} />
      <div className={styles.flLabel} style={{ fontSize, opacity: disabled ? 0.5 : 1 }}>
        {label}
      </div>
    </El>
  )
}
