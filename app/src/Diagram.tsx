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

export function NodeBox({ n, className = '', children, ...rest }: { n: NodeDef; className?: string; children?: ReactNode } & Omit<SVGProps<SVGGElement>, 'className'>) {
  const Icon = icons[n.icon]
  return (
    <g transform={`translate(${n.x - W / 2} ${n.y - H / 2})`} className={`node ${className}`} {...rest}>
      <rect width={W} height={H} rx={10} />
      <Icon x={W / 2 - 11} y={8} width={22} height={22} />
      <text x={W / 2} y={46} textAnchor="middle" className="label">{n.label}</text>
      {n.sub && <text x={W / 2} y={60} textAnchor="middle" className="sub">{n.sub}</text>}
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
