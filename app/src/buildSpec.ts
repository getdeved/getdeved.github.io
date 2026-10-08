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

    type Piece = { node?: NodeDef; edge?: EdgeDef }
    const pieces: Piece[] = []
    const placed = new Set(design.nodes.filter((n) => beforeIds.has(n.id)).map((n) => n.id))
    const done = new Set<string>()
    const fresh = (e: EdgeDef) => !beforeEdges.has(edgeKey(e)) && !done.has(edgeKey(e))
    for (const e of design.edges) if (placed.has(e.from) && placed.has(e.to) && fresh(e)) { pieces.push({ edge: e }); done.add(edgeKey(e)) }
    for (const nd of design.nodes.filter((n) => !beforeIds.has(n.id))) {
      pieces.push({ node: nd }); placed.add(nd.id)
      for (const e of design.edges) if ((e.from === nd.id || e.to === nd.id) && placed.has(e.from) && placed.has(e.to) && fresh(e)) { pieces.push({ edge: e }); done.add(edgeKey(e)) }
    }
    if (!pieces.length) return // a concept-only step has nothing to build

    // Requirements grow piece by piece: everything the earlier steps built, plus the pieces so far.
    const want = new Map<string, number>()
    const pairs = new Set<string>()
    const pair = (e: EdgeDef) => [lbl(e.from), lbl(e.to)].sort().join('|')
    for (const n of design.nodes) if (beforeIds.has(n.id)) want.set(kindOf(n.label), (want.get(kindOf(n.label)) ?? 0) + 1)
    for (const e of design.edges) if (beforeEdges.has(edgeKey(e))) pairs.add(pair(e))

    pieces.forEach((p, k) => {
      if (p.node) want.set(kindOf(p.node.label), (want.get(kindOf(p.node.label)) ?? 0) + 1)
      else pairs.add(pair(p.edge!))
      const need = new Map(want), needPairs = new Set(pairs)
      const last = k === pieces.length - 1
      const kind = p.node ? kindOf(p.node.label) : ''
      const a = p.edge ? lbl(p.edge.from) : '', c = p.edge ? lbl(p.edge.to) : ''

      tests.push({
        id: `${step.id}-${k}`, learn: i, group: step.title, context: step.situation, part: `part ${k + 1} of ${pieces.length}`,
        groupEnd: last, reveal: true,
        uses: p.node ? [kind] : [a, c],
        name: p.node ? `Add ${kind}` : `Connect ${a} and ${c}`,
        scenario: p.node ? (p.node.tip ?? '') : p.edge!.label ? `This link carries: ${p.edge!.label}.` : `${a} and ${c} need to talk to each other here.`,
        goal: p.node
          ? `Put ${kind} on the canvas: press Add next to it in the list on the left, or drag it in.`
          : `Draw a link: drag from the dot on the right edge of ${a} to ${c} (or the other way round).`,
        run: (g: G): Result => {
          const kinds = new Map(g.nodes.map((n) => [n.id, n.kind]))
          const missing: string[] = []
          for (const [kd, count] of need) {
            const have = g.nodes.filter((n) => n.kind === kd).length
            if (have < count) missing.push(count - have > 1 ? `${count - have} more ${kd}` : kd)
          }
          const linked = (pr: string) => g.edges.some((e) => [kinds.get(e.from), kinds.get(e.to)].sort().join('|') === pr)
          const unlinked = [...needPairs].filter((pr) => !linked(pr)).map((pr) => pr.split('|').join(' and '))
          if (!missing.length && !unlinked.length) {
            return { status: 'pass', why: last ? `Why this works: ${best.feedback}` : p.node ? 'Placed.' : 'Connected.' }
          }
          return {
            status: 'fail', why: 'Not yet.',
            hint: [missing.length ? `Add ${missing.join(', ')}.` : '', unlinked.length ? `Connect ${unlinked.join('; ')}.` : ''].filter(Boolean).join(' '),
          }
        },
      })
    })
  })

  const spec: BuildSpec = { palette: [...palette.values()], start: { nodes: [], edges: [] }, tests }
  cache.set(topic.id, spec)
  return spec
}
