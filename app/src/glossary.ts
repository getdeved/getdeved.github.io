export type Info = { name: string; what: string; use: string; watch: string }

// Keyed by node kind (see NodeDef.kind; defaults to the icon name).
export const glossary: Record<string, Info> = {
  users: {
    name: 'Users (clients)',
    what: 'Browsers and mobile apps sending requests to your system over HTTP.',
    use: 'They are the source of all traffic. Everything you add exists to serve them faster, more reliably, or for more of them at once.',
    watch: 'You do not control them: they are slow, far away, and arrive in bursts.',
  },
  dns: {
    name: 'DNS',
    what: 'The internet’s phone book. It turns a name like api.mysite.com into the IP address of a server.',
    use: 'Every request starts here. Usually a paid third-party service, not something your servers run.',
    watch: 'Answers are cached, so changing an IP is not instant.',
  },
  geodns: {
    name: 'GeoDNS',
    what: 'A DNS service that answers differently depending on where the user is.',
    use: 'Sends each user to the nearest data center, and away from one that is down.',
    watch: 'Only as good as its health checks, and you must keep data in sync across the sites it points to.',
  },
  server: {
    name: 'Web server',
    what: 'A machine running your application code. It receives requests, talks to the data tier, and returns HTML or JSON.',
    use: 'Where your business logic lives. Several identical servers let you grow and survive a failure.',
    watch: 'If it keeps user state in its own memory, you cannot freely add or remove servers.',
  },
  box: {
    name: 'Single server',
    what: 'One machine running everything: web code, database and cache.',
    use: 'The right starting point. Simple to build and run.',
    watch: 'Everything shares one CPU and one failure: if it dies, the whole site does.',
  },
  lb: {
    name: 'Load balancer',
    what: 'A front door that spreads incoming requests across a pool of servers.',
    use: 'Gives users one stable address, hides servers behind private IPs, and routes around a server that fails its health check.',
    watch: 'It can itself become a single point of failure, so production setups run it as a pair.',
  },
  db: {
    name: 'Database',
    what: 'The durable store for your data, relational (SQL) or non-relational (NoSQL).',
    use: 'Holds the source of truth. Everything else (caches, replicas) is a copy that can be rebuilt from it.',
    watch: 'One database is a single point of failure, and eventually a bottleneck for both size and writes.',
  },
  replica: {
    name: 'Database replica',
    what: 'A read-only copy of the primary database, kept up to date by copying its writes.',
    use: 'Spreads read traffic and keeps a copy of the data. If the primary dies, a replica can be promoted.',
    watch: 'It can lag behind the primary, so a read right after a write may return old data.',
  },
