import { useEffect, useState } from 'react'
import { Diagram, type Frame } from './Diagram'
import { Nav } from './Nav'
import { Tracks } from './Tracks'
import { topicCount } from './catalog'
import { buildDesign, type Design } from './engine'
import { scaling } from './topics/scaling'

const steps = scaling.steps

// Hero-only presentation: tidy columns, and one link per web *tier* instead of one per web server.
// Guided and Build views keep the positions and edges defined in the topic data.
const POS: Record<string, [number, number]> = {
  users: [65, 300], geodns: [200, 110], cdn: [200, 490], lb: [345, 300], mon: [345, 540],
  web3: [490, 140], web1: [490, 300], web2: [490, 460],
  session: [650, 110], cache: [650, 230], queue: [650, 370], workers: [650, 490],
  router: [800, 300], s1: [935, 160], s2: [935, 300], s3: [935, 440], dc2: [800, 540],
}
const ALIAS: Record<string, string> = { dns: 'geodns', box: 'web1', web: 'web1', db: 's2', replica: 's3' }
const WEBS = ['web1', 'web2', 'web3']
const laidOut = (d: Design): Design => ({
  ...d,
  nodes: d.nodes.map((n) => { const p = POS[ALIAS[n.id] ?? n.id]; return p ? { ...n, x: p[0], y: p[1] } : n }),
  edges: d.edges.filter((e) => !['web2', 'web3'].includes(e.from) && !(e.from === 'geodns' && e.to === 'dc2')),
})
const webFrame = (d: Design): Frame[] => {
  const ys = d.nodes.filter((n) => WEBS.includes(n.id)).map((n) => POS[n.id][1])
  if (ys.length < 2) return []
  return [{ x: 490 - 72, y: Math.min(...ys) - 64, w: 144, h: Math.max(...ys) - Math.min(...ys) + 128, label: 'Web tier' }]
}
const cachePrompt = steps.find((s) => s.id === 'cache')!.llmPrompt
const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

function Hero() {
  const [n, setN] = useState(reduced ? steps.length : 4)
  const [auto, setAuto] = useState(!reduced)
  useEffect(() => {
    if (!auto) return
    const t = setInterval(() => setN((v) => (v >= steps.length ? 1 : v + 1)), 2600)
    return () => clearInterval(t)
  }, [auto])
  const step = steps[n - 1]
  const best = step.options.find((o) => o.verdict === 'best')!

  return (
    <section className="hero">
      <h1>Your LLM writes the code.<br />You design the system.</h1>
      <p className="lead">
        DevEd teaches new developers how real systems are structured and scaled. You build one
        decision at a time: pick a fix, see the trade-off, watch the architecture grow.
      </p>
      <div className="cta">
        <a className="btn primary" href="#/playground">Open the playground</a>
        <a className="btn secondary" href="#curriculum">See the curriculum</a>
      </div>

