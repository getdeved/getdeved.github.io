import type { NodeDef, Topic } from '../types'

// Fixed canvas positions (1000x600) so the final diagram is laid out once, by hand.
const n = (id: string, label: string, icon: NodeDef['icon'], x: number, y: number, sub?: string): NodeDef =>
  ({ id, label, icon, x, y, sub })

export const scaling: Topic = {
  id: 'scaling',
  title: 'Scale from zero to millions of users',
  intro:
    'You start with one server. Each step below is a problem real systems hit as users grow. Pick the fix, see what it buys you and what it costs, and watch the architecture evolve.',
  recap: [
    'Keep the web tier stateless.',
    'Build redundancy at every tier: no single point of failure.',
    'Cache what is read often, and put static files on a CDN.',
    'Decouple slow work with queues.',
    'Scale the data tier by sharding when one database is not enough.',
    'Logs, metrics and automation are not optional once you have more than a few servers.',
  ],
  steps: [
    {
      id: 'single-server',
      title: 'What happens when someone opens your site?',
      situation:
        'A user types api.mysite.com into a browser. Your whole app (web code, database, cache) runs on one server. What happens first?',
      options: [
        {
          id: 'dns', label: 'The browser asks DNS for the server’s IP address', verdict: 'best',
          feedback:
            'Right. Browsers route by IP address, not by name. DNS (usually a paid third-party service, not run by your server) translates the name into an IP. Only then is the HTTP request sent, and the server replies with HTML or JSON.',
          add: {
            nodes: [n('users', 'Users', 'users', 70, 300, 'web + mobile'), n('dns', 'DNS', 'dns', 190, 120), { ...n('box', 'Single server', 'server', 560, 300, 'web + DB + cache'), kind: 'box' }],
            edges: [{ from: 'users', to: 'dns', label: '1 · look up IP' }, { from: 'users', to: 'box', label: '2 · HTTP request' }],
          },
          delta: { capacity: 0 },
        },
        {
          id: 'http', label: 'The browser sends the HTTP request to the server', verdict: 'wrong',
          feedback: 'Not yet. The browser only has a name like api.mysite.com, which is not an address. It needs an IP first.',
        },
        {
          id: 'db', label: 'The server queries the database', verdict: 'wrong',
          feedback: 'That happens later, and only after a request has reached the server.',
        },
      ],
      underTheHood: [
        'Two kinds of clients hit your server: web apps (server-side code for logic, HTML/JS for presentation) and mobile apps.',
        'Both usually speak HTTP, and JSON is the common response format because it is simple and light. Example: GET /users/12 returns user 12 as JSON.',
      ],
      llmPrompt:
        'Build a small HTTP API with GET /users/:id that returns JSON. It will run on one server behind the DNS name api.mysite.com.',
    },
    {
      id: 'split-db',
      title: 'One box is doing everything',
      situation:
        'About 1,000 users. The web code and the database fight over the same CPU and memory, and one heavy report query slows every page.',
      options: [
        {
          id: 'split', label: 'Move the database to its own server', verdict: 'best',
          feedback:
            'Right. The web tier and the data tier can now be scaled, tuned and failed independently: web servers need CPU, databases need RAM and fast disks.',
          remove: ['box'],
          add: {
            nodes: [n('web', 'Web server', 'server', 560, 300), n('db', 'Database', 'db', 880, 300)],
            edges: [{ from: 'users', to: 'web', label: 'HTTP' }, { from: 'web', to: 'db' }],
          },
          delta: { capacity: 10, complexity: 5 },
        },
        {
          id: 'bigger', label: 'Buy one bigger server', verdict: 'ok',
          feedback:
            'It works for a while and it is the simplest option. But everything still fails together, and cost per unit of power climbs steeply. Keep it in the toolbox; it just does not fix the root problem.',
        },
        {
          id: 'cache', label: 'Add a cache in front of the database', verdict: 'premature',
          feedback: 'Caching helps repeated reads, but web and DB still share one machine and one failure. You would be adding a moving part before fixing the structure.',
        },
        {
          id: 'nosql', label: 'Rewrite everything on NoSQL', verdict: 'wrong',
          feedback:
            'The database type is not the bottleneck here. Relational databases fit most apps and have 40+ years of tooling. Reach for NoSQL when you need super-low latency, unstructured data, just serialization, or massive data volume.',
        },
      ],
      underTheHood: [
        'Relational (SQL: MySQL, PostgreSQL): tables and rows, joins across tables.',
        'Non-relational (NoSQL): key-value, graph, column and document stores. Joins are generally not supported.',
        'Default to relational unless you have a concrete reason not to.',
      ],
      llmPrompt:
        'My Postgres currently runs on the same host as my API. Move it to a separate host reachable only over the private network, with the connection string coming from an environment variable.',
    },
    {
      id: 'up-or-out',
      title: 'Traffic keeps growing: scale up or out?',
      situation:
        'Both tiers are getting busy. You can make a machine bigger (vertical, “scale up”) or add more machines (horizontal, “scale out”). What is your plan for the web tier?',
      options: [
        {
          id: 'out', label: 'Plan to run several web servers', verdict: 'best',
          feedback:
            'Right. Vertical scaling has a hard ceiling (you cannot add unlimited CPU and RAM) and no failover. Horizontal scaling is how large systems grow. It does need something to spread requests across the servers, which is the next step.',
        },
        {
          id: 'up', label: 'Keep upgrading the one web server', verdict: 'ok',
          feedback:
            'Perfectly reasonable while traffic is low, since simplicity is its big advantage. But it has a hard limit, and if that one server goes down the whole site goes with it.',
        },
        {
          id: 'wait', label: 'Do nothing until it breaks', verdict: 'wrong',
          feedback: 'Peak traffic is the worst moment to learn your design cannot grow.',
        },
      ],
      underTheHood: [
        'Vertical: more CPU/RAM on the same machine. Easy, but capped and a single point of failure.',
        'Horizontal: more machines in a pool. Needs a load balancer, and your app must not depend on one machine’s memory or disk.',
      ],
      llmPrompt:
        'Review my API for anything that would break if I run three copies behind a load balancer: local files, in-memory state, cron jobs, singletons.',
    },
    {
      id: 'load-balancer',
      title: 'A web server just died',
      situation:
        'The only web server crashed at 2am and the site stayed down until you woke up. Clients also connect to the server’s IP directly.',
      options: [
        {
          id: 'lb', label: 'Put a load balancer in front of two or more web servers', verdict: 'best',
          feedback:
            'Right. Users hit the load balancer’s public IP; the web servers use private IPs and are unreachable from the internet (safer). If server 1 dies, traffic goes to server 2. If traffic grows, add servers to the pool and the balancer starts using them, with no client change.',
          remove: ['web'],
          add: {
            nodes: [n('lb', 'Load balancer', 'lb', 330, 300), n('web1', 'Web 1', 'server', 560, 210), n('web2', 'Web 2', 'server', 560, 390)],
            edges: [
              { from: 'users', to: 'lb' }, { from: 'lb', to: 'web1' }, { from: 'lb', to: 'web2' },
              { from: 'web1', to: 'db' }, { from: 'web2', to: 'db' },
            ],
          },
          delta: { capacity: 15, availability: 20, complexity: 10 },
        },
        {
          id: 'rr', label: 'List both servers’ IPs in DNS (round robin)', verdict: 'ok',
          feedback: 'Spreads traffic roughly, but DNS answers are cached, so a dead server keeps receiving requests until records expire, and clients see your servers’ real addresses.',
        },
        {
          id: 'restart', label: 'Write a script that restarts the server faster', verdict: 'wrong',
          feedback: 'Faster recovery is nice, but one server is still a single point of failure, and users still see downtime.',
        },
        {
          id: 'db2', label: 'Add a second database', verdict: 'premature',
          feedback: 'The database is a real gap, but it did not cause this outage. Fix the web tier first; replication comes next.',
        },
      ],
      underTheHood: [
        'The balancer runs health checks and stops sending traffic to servers that fail them.',
        'Common algorithms: round robin, least connections, hashing on client IP.',
        'The balancer itself can become a single point of failure, so production setups run it in pairs.',
      ],
      llmPrompt:
        'Write an nginx config that load-balances across two upstream servers, with health checks and automatic removal of failing nodes.',
    },
    {
      id: 'replication',
      title: 'The database is a single point of failure',
      situation:
        'The web tier survives failures now. But if the database dies, everything stops and data can be lost. Also, about 90% of queries are reads.',
      options: [
        {
          id: 'replica', label: 'One primary for writes, plus replicas for reads', verdict: 'best',
          feedback:
            'Right. Writes go to the primary; reads are spread over replicas, so more queries run in parallel and data survives the loss of a machine. If a replica dies, reads go to the others. If the primary dies, a replica is promoted.',
          add: {
            nodes: [n('replica', 'Replica', 'replica', 880, 420, 'read-only')],
            edges: [{ from: 'db', to: 'replica', label: 'copies writes', dashed: true }, { from: 'web2', to: 'replica', label: 'reads' }],
          },
          delta: { capacity: 5, availability: 15, speed: 5, complexity: 10 },
        },
        {
          id: 'backup', label: 'Take nightly backups', verdict: 'ok',
          feedback: 'Backups protect against data loss, not downtime. Restoring takes hours, and all reads still hit one machine. Do this anyway, just not as the answer here.',
        },
        {
          id: 'ram', label: 'Give the database more RAM', verdict: 'wrong',
          feedback: 'Faster, maybe, but it is still one machine. It does not remove the single point of failure.',
        },
        {
          id: 'shard', label: 'Shard the database now', verdict: 'premature',
          feedback: 'Sharding addresses data size and write volume, not availability, and adds a lot of complexity. Save it for when one primary truly cannot cope.',
        },
      ],
      underTheHood: [
        'Replicas usually outnumber primaries, because most apps read far more than they write.',
        'Promoting a replica is trickier than it sounds: the replica may be behind, so missing data must be recovered with scripts.',
        'Multi-primary and circular replication exist but are significantly more complex.',
      ],
      llmPrompt:
        'Configure Postgres streaming replication with one primary and two read replicas, and route SELECTs to replicas and writes to the primary. How should my code handle replication lag right after a write?',
    },
    {
      id: 'cache',
      title: 'The same data is fetched thousands of times',
      situation:
        'Each page load runs many queries, mostly for data that rarely changes (profiles, product info). Database CPU is high even with replicas.',
      options: [
        {
          id: 'cache', label: 'Add a cache tier in front of the database', verdict: 'best',
          feedback:
            'Right. The app checks the cache first; on a miss it reads the database, stores the result, and returns it (a read-through cache). Memory is much faster than disk, the database sees less load, and the cache scales on its own.',
          add: {
            nodes: [n('cache', 'Cache', 'cache', 700, 210, 'in memory')],
            edges: [{ from: 'web1', to: 'cache' }, { from: 'web2', to: 'cache' }],
          },
          delta: { speed: 20, capacity: 10, complexity: 5 },
        },
        {
          id: 'web', label: 'Add more web servers', verdict: 'wrong',
          feedback: 'The bottleneck is the database. More web servers just send it more queries.',
        },
        {
          id: 'replicas', label: 'Add more read replicas', verdict: 'ok',
          feedback: 'It helps, but every replica is a full copy on disk. A cache serves the hot data from memory far more cheaply.',
        },
        {
          id: 'forever', label: 'Cache everything forever', verdict: 'wrong',
          feedback: 'Data goes stale and memory fills up. Every cache needs an expiration policy and an eviction policy.',
        },
      ],
      underTheHood: [
        'Use a cache for data that is read often but changed rarely. It is volatile memory, so never keep the only copy of important data there.',
        'Expiration (TTL): not too short (constant reloads), not too long (stale data).',
        'Eviction when full: LRU is the usual default; LFU and FIFO exist.',
        'Consistency: updating the DB and the cache is not one transaction, so they can drift.',
        'A single cache server is a single point of failure; run several.',
      ],
      llmPrompt:
        'Add read-through caching with Redis to getUser(id): 5 minute TTL, invalidate on update, and fall back to the database if Redis is down.',
    },
