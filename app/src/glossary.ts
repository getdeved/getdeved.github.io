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
  cache: {
    name: 'Cache',
    what: 'A fast in-memory store (such as Redis or Memcached) holding results of expensive or frequent reads.',
    use: 'Check the cache first; on a miss read the database and store the answer. Takes read load off the database.',
    watch: 'Data can go stale, it disappears on restart, and a single cache server is a single point of failure. Set a TTL and an eviction policy.',
  },
  cdn: {
    name: 'CDN',
    what: 'A network of servers around the world that keep copies of your static files (images, CSS, JS, video).',
    use: 'Serves files from a location near the user, so pages load faster and your servers do less work.',
    watch: 'You pay per transfer, and updated files must be invalidated or versioned (image.png?v=2).',
  },
  session: {
    name: 'Session store',
    what: 'A shared store (often a cache or NoSQL database) that holds who is logged in and other per-user state.',
    use: 'Lets web servers stay stateless: any server can handle any request, so servers can be added or removed freely.',
    watch: 'It becomes critical infrastructure; if it is down, nobody stays logged in.',
  },
  queue: {
    name: 'Message queue',
    what: 'A durable buffer. Producers put messages (jobs) in; consumers take them out when ready.',
    use: 'Moves slow work off the request path, and lets producers and consumers scale and fail independently.',
    watch: 'Work becomes asynchronous: you must handle retries, duplicates and the user not seeing the result immediately.',
  },
  worker: {
    name: 'Worker',
    what: 'A process that pulls jobs from a queue and performs them, for example resizing a photo.',
    use: 'Runs the slow, heavy work in the background. Add more workers when the queue grows.',
    watch: 'Jobs may run twice after a failure, so make them safe to repeat (idempotent).',
  },
  monitor: {
    name: 'Logs and metrics',
    what: 'Central collection of logs, health numbers (CPU, errors, latency) and alerts from every tier.',
    use: 'Tells you what is broken, where, and often before users notice. Pairs with automated build and deploy.',
    watch: 'Alerts people ignore are worse than none: alert on what needs action.',
  },
  dc: {
    name: 'Data center',
    what: 'A separate site (region) running its own copy of the stack.',
    use: 'Survives losing a whole building or region, and serves far-away users with lower latency.',
    watch: 'Data must be replicated between sites, and deployments must be automated so every site runs the same code.',
  },
  shard: {
    name: 'Database shard',
    what: 'One slice of a large database. Every shard has the same schema but holds different rows, chosen by a key such as user_id.',
    use: 'Splits data size and write load across machines when one database cannot cope.',
    watch: 'Pick a key that spreads data evenly, expect pain with cross-shard joins, and plan for resharding and hot keys.',
  },
  router: {
    name: 'Shard router',
    what: 'The logic that looks at a key (like user_id) and decides which shard holds that data.',
    use: 'Keeps the application from needing to know how the data is split.',
    watch: 'Changing the number of shards moves data around; consistent hashing reduces how much.',
  },
}
