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

const pass = (why: string): Result => ({ status: 'pass', why })
const fail = (why: string, hint: string): Result => ({ status: 'fail', why, hint })

export const tests: Test[] = [
  {
    id: 'flow', name: 'Normal traffic', scenario: 'A user opens the site.', goal: 'Confirm users can reach your data. Your starting design should already handle this.', uses: ['server', 'db'], learn: 1,
    run: (g) => {
      if (!webs(g).length) return fail('Users are not connected to any web server.', 'Connect Users to a web server, or to a load balancer that fronts servers.')
      if (!webs(g).some((s) => reachesData(g, s))) return fail('No web server reaches a database.', 'Connect a web server to a database.')
      return pass('Requests reach a web server and the data behind it.')
    },
  },
  {
    id: 'crash', name: 'A web server crashes', scenario: 'Server 1 dies at 2am.', goal: 'Keep the site up when a web server dies.', uses: ['lb', 'server'], learn: 3,
    run: (g) => {
      const behind = lbWebs(g).filter((s) => reachesData(g, s))
      if (entryLbs(g).length && behind.length >= 2) return pass('The load balancer routes around the dead server; the others keep serving.')
      if (!entryLbs(g).length) return fail('Users hit servers directly, so one dead server is a dead site (or a broken DNS entry).', 'Put a load balancer between Users and the web servers, with two or more servers behind it.')
      if (lbWebs(g).length >= 2) return fail('Not every server behind the load balancer is connected to a database, so only one can actually serve requests.', 'Connect each web server to the database.')
      return fail('Only one server sits behind the load balancer, so there is nothing to fail over to.', 'Add a second web server, connect it to the load balancer and the database.')
    },
  },
  {
    id: 'dbcrash', name: 'The database crashes', scenario: 'The primary database dies.', goal: 'Keep data and reads available when the database dies.', uses: ['replica'], learn: 4,
    run: (g) => {
      if (g.nodes.some((n) => n.kind === 'replica' && peers(g, n.id).some(isStore))) return pass('A replica holds a copy and can be promoted; reads continue meanwhile.')
      return fail('The database is a single point of failure: reads and writes stop and data may be lost.', 'Add a replica and connect it to the database.')
    },
  },
  {
    id: 'reads', name: 'Reads pile up', scenario: 'Most queries fetch the same rarely-changing data.', goal: 'Take repeated reads off the database.', uses: ['cache'], learn: 5,
    run: (g) => {
      if (webs(g).some((s) => has(g, s.id, 'cache'))) return pass('Hot reads are answered from memory; the database sees far less load.')
      return fail('Every read goes to the database, so database CPU is the bottleneck.', 'Add a cache and connect it to your web servers.')
    },
  },
  {
    id: 'far', name: 'Visitors on another continent', scenario: 'Users in Asia load images and scripts from your servers.', goal: 'Make static files load fast for users far away.', uses: ['cdn'], learn: 6,
    run: (g) => {
      if (of(g, 'cdn').some((c) => has(g, c.id, 'users'))) return pass('Static files are served from a nearby CDN location.')
      return fail('Static files travel across the world on every page load.', 'Add a CDN and connect it to Users.')
    },
  },
  {
    id: 'stateless', name: 'Autoscaling adds a server', scenario: 'A new server joins mid-session.', goal: 'Let servers join or leave without logging users out.', uses: ['session'], learn: 7,
    run: (g) => {
      const w = webs(g)
      if (w.length < 2) return { status: 'skip', why: 'Needs two or more web servers first.' }
      if (w.every((s) => has(g, s.id, 'session'))) return pass('Session data lives in a shared store, so any server can serve any user.')
      return fail('Sessions live in each server’s memory, so users get logged out when they land on another server.', 'Add a session store and connect every web server to it.')
    },
  },
  {
    id: 'dc', name: 'A data center loses power', scenario: 'Everything in the building goes dark.', goal: 'Survive losing a whole data center.', uses: ['dc'], learn: 8,
    run: (g) => {
      if (of(g, 'dc').some((d) => peers(g, d.id).length)) return pass('A second site is running and can take the traffic.')
      return fail('Everything lives in one building: one outage takes the whole system down.', 'Add a second data center and connect it (replication) to your stack.')
    },
  },
  {
    id: 'queue', name: 'Photo uploads spike', scenario: 'Resizing takes 30 seconds per upload.', goal: 'Keep slow jobs from blocking user requests.', uses: ['queue', 'worker'], learn: 9,
    run: (g) => {
      if (of(g, 'queue').some((q) => has(g, q.id, 'server') && has(g, q.id, 'worker'))) return pass('Uploads are queued and processed by workers; requests return immediately.')
      return fail('Slow work blocks web requests and overwhelms the servers.', 'Add a message queue between a web server and a worker.')
    },
  },
  {
    id: 'monitor', name: 'Something breaks, nobody knows what', scenario: 'Users report errors; you cannot tell which tier.', goal: 'Find out what broke before users tell you.', uses: ['monitor'], learn: 10,
    run: (g) => {
      if (of(g, 'monitor').some((m) => peers(g, m.id).length)) return pass('Logs and metrics from the system are collected and alertable.')
      return fail('You find out about problems when users tell you.', 'Add logs and metrics and connect them to your system.')
    },
  },
  {
    id: 'shards', name: 'Data outgrows one database', scenario: 'Hundreds of millions of rows and heavy writes.', goal: 'Spread data and writes across several databases.', uses: ['shard'], learn: 11,
    run: (g) => {
      if (of(g, 'shard').filter((s) => peers(g, s.id).length).length >= 2) return pass('Data and writes are split across shards.')
      return fail('One database has to hold everything and take every write.', 'Add two or more database shards and connect them to your servers.')
    },
  },
]
