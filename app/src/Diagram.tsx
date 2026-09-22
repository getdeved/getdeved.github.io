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

