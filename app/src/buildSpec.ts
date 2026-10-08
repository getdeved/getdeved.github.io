// What Build & test needs for a topic: the components you can place, the starting canvas, and the challenges.
// Scaling has hand-written scenarios (sim.ts). Every other topic gets challenges generated from its Guided steps:
// a challenge passes when your canvas contains the components and links the step introduces.
import { buildDesign } from './engine'
import type { IconName } from './icons'
import { tests as scalingTests, type G, type Result, type Test } from './sim'
import type { EdgeDef, NodeDef, Topic } from './types'

export type PaletteItem = { kind: string; label: string; icon: IconName; tip?: string }
export type BuildSpec = { palette: PaletteItem[]; start: { nodes: NodeDef[]; edges: EdgeDef[] }; tests: Test[] }

export const scalingSpec: BuildSpec = {
  palette: [
    { kind: 'server', label: 'Web server', icon: 'server' }, { kind: 'lb', label: 'Load balancer', icon: 'lb' }, { kind: 'db', label: 'Database', icon: 'db' },
    { kind: 'replica', label: 'Replica', icon: 'replica' }, { kind: 'cache', label: 'Cache', icon: 'cache' }, { kind: 'cdn', label: 'CDN', icon: 'cdn' },
    { kind: 'session', label: 'Session store', icon: 'session' }, { kind: 'queue', label: 'Queue', icon: 'queue' }, { kind: 'worker', label: 'Worker', icon: 'worker' },
    { kind: 'monitor', label: 'Logs · metrics', icon: 'monitor' }, { kind: 'dc', label: 'Data center', icon: 'dc' }, { kind: 'shard', label: 'DB shard', icon: 'db' },
  ],
  start: {
    nodes: [
      { id: 'users', kind: 'users', label: 'Users', icon: 'users', x: 90, y: 300 },
      { id: 'n1', kind: 'server', label: 'Web server', icon: 'server', x: 400, y: 300 },
      { id: 'n2', kind: 'db', label: 'Database', icon: 'db', x: 800, y: 300 },
    ],
    edges: [{ from: 'users', to: 'n1' }, { from: 'n1', to: 'n2' }],
  },
  tests: scalingTests,
}

// "Web 1", "Web N", "Node A", "Replica B2" are all the same kind of box.
export const kindOf = (label: string) => label.replace(/\s+([A-Z]|\d+|[A-Z]\d+)$/, '').trim()

const cache = new Map<string, BuildSpec>()

// Each Guided step becomes a run of tiny challenges: place one component, or draw one link, at a time.
export function autoSpec(topic: Topic): BuildSpec {
  const hit = cache.get(topic.id)
  if (hit) return hit

  const palette = new Map<string, PaletteItem>()
  for (const s of topic.steps) for (const nd of s.options.find((o) => o.verdict === 'best')?.add?.nodes ?? []) {
    const kind = kindOf(nd.label)
    if (!palette.has(kind)) palette.set(kind, { kind, label: kind, icon: nd.icon, tip: nd.tip })
  }

  const tests: Test[] = []
  const edgeKey = (e: EdgeDef) => `${e.from}>${e.to}`

  topic.steps.forEach((step, i) => {
    const best = step.options.find((o) => o.verdict === 'best')!
    const before = buildDesign(topic.steps, i)
    const design = buildDesign(topic.steps, i + 1)
    const beforeIds = new Set(before.nodes.map((n) => n.id))
    const beforeEdges = new Set(before.edges.map(edgeKey))
    const byId = new Map(design.nodes.map((n) => [n.id, n]))
    const lbl = (id: string) => kindOf(byId.get(id)!.label)

