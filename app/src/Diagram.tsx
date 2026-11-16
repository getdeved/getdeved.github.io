import type { ReactNode, SVGProps } from 'react'
import { icons } from './icons'
import type { Design } from './engine'
import type { NodeDef } from './types'

export const W = 104, H = 68

// Trim a line so it starts/ends at the node box edge instead of its centre.
export function clip(dx: number, dy: number) {
  const t = Math.min(dx ? W / 2 / Math.abs(dx) : Infinity, dy ? H / 2 / Math.abs(dy) : Infinity)
  return { x: dx * t, y: dy * t }
}

export function Defs() {
  return (
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0 0L10 5L0 10z" className="arrowhead" />
      </marker>
    </defs>
  )
}

// Labels must stay inside the box: measure with the real font, then shrink and wrap onto two lines if needed.
const MAX_TEXT = 92
let ctx: CanvasRenderingContext2D | null | undefined
const measure = (s: string, px: number) => {
  ctx ??= typeof document === 'undefined' ? null : document.createElement('canvas').getContext('2d')
  if (!ctx) return s.length * px * 0.58
  ctx.font = `600 ${px}px Geist, system-ui, sans-serif`
  return ctx.measureText(s).width
}
export function fitLabel(label: string): { lines: string[]; size: number } {
  if (measure(label, 13) <= MAX_TEXT) return { lines: [label], size: 13 }
  if (measure(label, 11.5) <= MAX_TEXT) return { lines: [label], size: 11.5 }
  const words = label.split(' ')
  let best: string[] | null = null, bestW = Infinity
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')]
    const w = Math.max(...pair.map((s) => measure(s, 11.5)))
    if (w < bestW) { best = pair; bestW = w }
  }
  if (best && bestW <= MAX_TEXT) return { lines: best, size: 11.5 }
  // last resort (a very long word): shrink further and cut with an ellipsis
  const size = 10
  const cut = (s: string) => { while (s.length > 3 && measure(`${s}…`, size) > MAX_TEXT) s = s.slice(0, -1); return `${s}…` }
  return { lines: (best ?? [label]).map((s) => (measure(s, size) <= MAX_TEXT ? s : cut(s))), size }
}

export function NodeBox({ n, className = '', children, ...rest }: { n: NodeDef; className?: string; children?: ReactNode } & Omit<SVGProps<SVGGElement>, 'className'>) {
  const Icon = icons[n.icon]
  const { lines, size } = fitLabel(n.label)
  const two = lines.length === 2
  return (
    <g transform={`translate(${n.x - W / 2} ${n.y - H / 2})`} className={`node ${className}`} {...rest}>
      <rect width={W} height={H} rx={10} />
      <Icon x={W / 2 - 11} y={7} width={22} height={22} />
      {lines.map((l, i) => (
        <text key={i} x={W / 2} y={two ? 41 + i * 12 : 46} textAnchor="middle" className="label" style={{ fontSize: size }}>{l}</text>
      ))}
      {n.sub && <text x={W / 2} y={two ? 65 : 60} textAnchor="middle" className="sub" style={two ? { fontSize: 9 } : undefined}>{n.sub}</text>}
      {children}
    </g>
  )
}

export const kindOf = (n: NodeDef) => n.kind ?? n.icon

export type Frame = { x: number; y: number; w: number; h: number; label: string }

export function Diagram({ design, onNodeClick, frames = [] }: { design: Design; onNodeClick?: (n: NodeDef) => void; frames?: Frame[] }) {
  const byId = new Map(design.nodes.map((n) => [n.id, n]))
  return (
    <svg viewBox="0 0 1000 600" className="diagram" role="img" aria-label="System architecture diagram">
      <Defs />
      {!design.nodes.length && <text x={500} y={300} textAnchor="middle" className="empty">Your architecture appears here</text>}
      {frames.map((f) => (
        <g key={f.label} className="frame">
          <rect x={f.x} y={f.y} width={f.w} height={f.h} rx={14} />
          <text x={f.x + 12} y={f.y + 18}>{f.label}</text>
        </g>
      ))}
      {design.edges.map((e, i) => {
        const a = byId.get(e.from)!, b = byId.get(e.to)!
        const dx = b.x - a.x, dy = b.y - a.y
        const s = clip(dx, dy), t = clip(-dx, -dy)
        const x1 = a.x + s.x, y1 = a.y + s.y, x2 = b.x + t.x, y2 = b.y + t.y
        return (
          <g key={i} className="edge">
            <line x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray={e.dashed ? '6 5' : undefined} markerEnd="url(#arrow)" />
            {e.label && <text x={(x1 + x2) / 2} y={(y1 + y2) / 2 - 6} textAnchor="middle">{e.label}</text>}
          </g>
        )
      })}
      {design.nodes.map((n) => (
        <NodeBox
          key={n.id} n={n} className={`${design.added.includes(n.id) ? 'fresh' : ''} ${onNodeClick ? 'clickable' : ''}`}
          {...(onNodeClick && {
            role: 'button', tabIndex: 0, 'aria-label': `About ${n.label}`,
            onClick: () => onNodeClick(n),
            onKeyDown: (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onNodeClick(n)),
          })}
        />
      ))}
    </svg>
  )
}
