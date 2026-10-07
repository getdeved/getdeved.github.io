import { useEffect, useRef, useState } from 'react'
import { Check, Maximize2, Minus, Plus, X } from 'lucide-react'
import { Defs, H, NodeBox, W, clip } from './Diagram'
import type { Inspect } from './InfoDialog'
import { glossary } from './glossary'
import { icons } from './icons'
import type { BuildSpec } from './buildSpec'
import type { Result } from './sim'

type Drag = { id: string; ox: number; oy: number; sx: number; sy: number; moved: boolean }
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

export default function Builder({ spec, onInspect, onLearn }: { spec: BuildSpec; onInspect: (i: Inspect) => void; onLearn: (step: number) => void }) {
  const { palette, start, tests } = spec
  const finalTests = tests.filter((t) => t.groupEnd ?? true) // generated specs end each group with one summary check
  const [nodes, setNodes] = useState(start.nodes)
  const [edges, setEdges] = useState(start.edges)
  const [conn, setConn] = useState<{ from: string; x: number; y: number } | null>(null)
  const [idx, setIdx] = useState(0) // current challenge; idx === tests.length means the final run
  const [result, setResult] = useState<Result | null>(null)
  const [all, setAll] = useState<Record<string, Result> | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const drag = useRef<Drag | null>(null)
  const nextId = useRef(100)
  const [view, setView] = useState({ x: 0, y: 0, z: 1 }) // viewBox = x y (1000/z) (600/z)
  const pan = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null)

  // zoom by factor f around svg-space point (px, py); defaults to the view centre
  const zoom = (f: number, px?: number, py?: number) => setView((v) => {
    const z = clamp(v.z * f, 0.5, 3)
    const cx = px ?? v.x + 500 / v.z, cy = py ?? v.y + 300 / v.z
    return { z, x: cx - (cx - v.x) * v.z / z, y: cy - (cy - v.y) * v.z / z }
  })
  useEffect(() => { // ctrl/cmd + wheel zooms at the cursor; needs a non-passive listener to stop page zoom
    const el = svg.current!
    const h = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(el.getScreenCTM()!.inverse())
      zoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, p.x, p.y)
    }
    el.addEventListener('wheel', h, { passive: false })
    return () => el.removeEventListener('wheel', h)
  }, [])

  // A generated challenge passes as soon as the canvas satisfies it, so there is no need to press Run.
  useEffect(() => {
    const t = tests[idx]
    if (t?.reveal) { const r = t.run({ nodes: nodes.map((n) => ({ id: n.id, kind: n.kind! })), edges }); if (r.status === 'pass') setResult(r) }
  }, [nodes, edges, idx])

  // Editing the design invalidates a failed run, but a passed challenge stays passed.
  useEffect(() => setResult((r) => (r?.status === 'pass' ? r : null)), [nodes.length, edges.length])

  const point = (e: { clientX: number; clientY: number }) => {
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(svg.current!.getScreenCTM()!.inverse())
    return { x: p.x, y: p.y }
  }
  const nodeAt = (x: number, y: number) => nodes.find((n) => Math.abs(x - n.x) <= W / 2 && Math.abs(y - n.y) <= H / 2)

