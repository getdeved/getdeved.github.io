// Topology-only simulator for Build & test mode. Each test inspects the user's graph
// (who is wired to whom) and reports whether the design survives a scenario.
// shortcut: edges are treated as undirected links and there is no real load model; upgrade if we need numbers.
export type G = { nodes: { id: string; kind: string }[]; edges: { from: string; to: string }[] }
export type Result = { status: 'pass' | 'fail' | 'skip'; why: string; hint?: string }
// goal: what the learner is asked to achieve; uses: component kinds revealed as a hint after a failed run.
// Generated tests also carry group (the Guided problem), part ("2 of 6"), groupEnd (last piece of a group, used for the
// final run) and reveal (name the needed component up front instead of only after a failed run).
export type Test = {
  id: string; name: string; scenario: string; goal: string; uses: string[]; learn: number; run: (g: G) => Result
  group?: string; context?: string; part?: string; groupEnd?: boolean; reveal?: boolean
}

const of = (g: G, kind: string) => g.nodes.filter((n) => n.kind === kind)
const peers = (g: G, id: string) =>
  g.edges.flatMap((e) => (e.from === id ? [e.to] : e.to === id ? [e.from] : []))
    .map((i) => g.nodes.find((n) => n.id === i)!).filter(Boolean)
const has = (g: G, id: string, kind: string) => peers(g, id).some((p) => p.kind === kind)
const uniq = <T extends { id: string }>(xs: T[]) => [...new Map(xs.map((x) => [x.id, x])).values()]
const isStore = (n: { kind: string }) => n.kind === 'db' || n.kind === 'shard'

const entryLbs = (g: G) => of(g, 'lb').filter((l) => has(g, l.id, 'users'))
const directWebs = (g: G) => of(g, 'server').filter((s) => has(g, s.id, 'users'))
const lbWebs = (g: G) => uniq(entryLbs(g).flatMap((l) => peers(g, l.id).filter((p) => p.kind === 'server')))
const webs = (g: G) => uniq([...directWebs(g), ...lbWebs(g)])
const reachesData = (g: G, s: { id: string }) => peers(g, s.id).some(isStore)

