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

  const add = (kind: string, at?: { x: number; y: number }) => {
    let pos = at
    if (!pos) { // first free grid slot
      outer: for (let x = 260; x <= 900; x += 130) for (let y = 110; y <= 520; y += 100)
        if (!nodes.some((n) => Math.abs(n.x - x) < 115 && Math.abs(n.y - y) < 80)) { pos = { x, y }; break outer }
      pos ??= { x: 500, y: 300 }
    }
    const item = palette.find((p) => p.kind === kind)!
    setNodes((ns) => [...ns, { id: `n${nextId.current++}`, kind, icon: item.icon, label: item.label, tip: item.tip, x: clamp(pos!.x, 60, 940), y: clamp(pos!.y, 45, 555) }])
  }
  const remove = (id: string) => {
    setNodes((ns) => ns.filter((n) => n.id !== id))
    setEdges((es) => es.filter((e) => e.from !== id && e.to !== id))
  }

  const onMove = (e: React.PointerEvent) => {
    const p = point(e)
    const d = drag.current
    if (pan.current) {
      const k = 1000 / view.z / svg.current!.clientWidth, a = pan.current
      setView((v) => ({ ...v, x: a.vx - (e.clientX - a.sx) * k, y: a.vy - (e.clientY - a.sy) * k }))
    } else if (d) {
      if (Math.hypot(p.x - d.sx, p.y - d.sy) > 4) d.moved = true
      if (d.moved) setNodes((ns) => ns.map((n) => (n.id === d.id ? { ...n, x: clamp(p.x - d.ox, 60, 940), y: clamp(p.y - d.oy, 45, 555) } : n)))
    } else if (conn) setConn({ ...conn, x: p.x, y: p.y })
  }
  const onUp = (e: React.PointerEvent) => {
    const p = point(e)
    const d = drag.current
    if (pan.current) pan.current = null
    else if (d) {
      drag.current = null
      if (!d.moved) {
        const n = nodes.find((x) => x.id === d.id)!
        onInspect({ kind: n.kind!, name: n.label, tip: n.tip, onRemove: n.id === 'users' ? undefined : () => remove(n.id) })
      }
    } else if (conn) {
      const t = nodeAt(p.x, p.y)
      if (t && t.id !== conn.from && !edges.some((x) => (x.from === conn.from && x.to === t.id) || (x.from === t.id && x.to === conn.from)))
        setEdges((es) => [...es, { from: conn.from, to: t.id }])
      setConn(null)
    }
  }

  const graph = () => ({ nodes: nodes.map((n) => ({ id: n.id, kind: n.kind! })), edges })
  const runOne = () => setResult(tests[idx].run(graph()))
  const runAll = () => { const g = graph(); setAll(Object.fromEntries(finalTests.map((t) => [t.id, t.run(g)]))) }
  const next = () => {
    setResult(null)
    setIdx(idx + 1)
    if (idx + 1 === tests.length) runAll()
  }
  const reset = () => { setNodes(start.nodes); setEdges(start.edges); setIdx(0); setResult(null); setAll(null) }
  const byId = new Map(nodes.map((n) => [n.id, n]))
  const total = tests.length
  const final = idx >= total
  const test = tests[idx]
  const hinted = test && (test.reveal || result?.status === 'fail') ? test.uses : []
  const passed = all ? finalTests.filter((t) => all[t.id]?.status === 'pass').length : 0

  return (
    <div className="mode">
      <div className="build-grid">
        <aside className="library" aria-label="Component reference">
          <h2>Components</h2>
          <p className="hint">What each piece is and where it fits. Drag onto the canvas, or press Add.</p>
          {palette.map((p) => {
            const g = p.tip ? { name: p.label, what: p.tip, use: '', watch: '' } : glossary[p.kind], Icon = icons[p.icon]
            return (
              <div key={p.kind} className={`lib ${hinted.includes(p.kind) ? 'hinted' : ''}`} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', p.kind)}>
                <div className="lib-head"><Icon size={16} /><b>{g.name}</b><button onClick={() => add(p.kind)} aria-label={`Add ${g.name}`}>Add</button></div>
                <p>{g.what}</p>
                {g.use && (
                  <details>
                    <summary>Where to use it</summary>
                    <p>{g.use}</p>
                    <p><b>Watch out:</b> {g.watch}</p>
                  </details>
                )}
              </div>
            )
          })}
        </aside>

        <div className="build-main">
          <section className={`card challenge ${final ? "" : result?.status ?? ""}`}>
            {final ? (
              <>
                <p className="eyebrow">All {total} challenges done</p>
                <h2>Full run</h2>
                <p>Every scenario against the design you built.</p>
                <p className="score" role="status">{passed} of {finalTests.length} {finalTests[0]?.group ? 'problems solved' : 'scenarios survived'}</p>
                <ul className="tests">
                  {finalTests.map((t) => {
                    const r = all?.[t.id]
                    return (
                      <li key={t.id} className={r?.status ?? 'idle'}>
                        <div className="t-head">
                          {r?.status === 'pass' ? <Check size={16} aria-label="Passed" /> : r?.status === 'fail' ? <X size={16} aria-label="Failed" /> : <Minus size={16} aria-label="Not applicable" />}
                          <b>{t.group ?? t.name}</b>
                        </div>
                        {r && <p>{r.why}</p>}
                        {r?.status === 'fail' && <p className="t-hint">{r.hint}</p>}
                      </li>
                    )
                  })}
                </ul>
                <div className="row">
                  <button className="run" onClick={runAll}>Run again</button>
                  <button onClick={reset}>Start over</button>
                </div>
                <p className="hint">The canvas is still editable: change the design and run again.</p>
              </>
            ) : (
              <>
                <p className="eyebrow">Challenge {idx + 1} of {total}{test.part && ` · ${test.part}`}</p>
                <progress value={idx} max={total} aria-label="Progress" />
                {test.group && <p className="group"><b>{test.group}.</b> {test.context}</p>}
                <h2>{test.name}</h2>
                {test.scenario && <p>{test.scenario}</p>}
                <p className="goal"><b>Goal:</b> {test.goal}</p>
                <div className="row">
                  {result?.status === 'pass'
                    ? <button className="run" onClick={next}>{idx + 1 === total ? 'See the full run' : 'Next challenge'}</button>
                    : <button className="run" onClick={runOne}>Run test</button>}
                  {idx > 0 && <button onClick={reset}>Start over</button>}
                </div>
                {result && (
                  <p className={`outcome ${result.status}`} role="status">
                    <b>{result.status === 'pass' ? 'Passed. ' : result.status === 'fail' ? 'Not yet. ' : ''}</b>{result.why}
                    {result.status === 'fail' && <> {result.hint} <button className="linklike" onClick={() => onLearn(test.learn)}>Learn this in guided mode</button></>}
                  </p>
                )}
              </>
            )}
          </section>

