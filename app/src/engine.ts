import type { EdgeDef, Metrics, NodeDef, Step } from './types'

const START: Metrics = { capacity: 10, availability: 15, speed: 40, complexity: 10 }

export type Design = { nodes: NodeDef[]; edges: EdgeDef[]; metrics: Metrics; added: string[] }

// Replays the 'best' option of every solved step, in order.
export function buildDesign(steps: Step[], solvedCount: number): Design {
  let nodes: NodeDef[] = []
  let edges: EdgeDef[] = []
  let metrics = { ...START }
  let added: string[] = []
  for (const step of steps.slice(0, solvedCount)) {
    const best = step.options.find((o) => o.verdict === 'best')
    if (!best) continue
    const gone = new Set(best.remove ?? [])
    nodes = nodes.filter((x) => !gone.has(x.id))
    nodes = [...nodes, ...(best.add?.nodes ?? [])]
    const cut = new Set(best.cut ?? [])
    edges = [...edges.filter((x) => !cut.has(`${x.from}>${x.to}`)), ...(best.add?.edges ?? [])]
    added = (best.add?.nodes ?? []).map((x) => x.id)
    for (const k of Object.keys(best.delta ?? {}) as (keyof Metrics)[]) metrics[k] += best.delta![k]!
  }
  const ids = new Set(nodes.map((x) => x.id))
  edges = edges.filter((e) => ids.has(e.from) && ids.has(e.to))
  return { nodes, edges, metrics, added }
}
