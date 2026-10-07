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

