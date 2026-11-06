import { alt, best, n, step } from './dsl'
import type { Extras } from './extras1'

export const extras2: Extras = {
  'url-shortener': {
    redirect: [
      step('model', 'What do we store?', 'Each short link needs a record. What is the minimum?', [
        best('row', 'A row with an ID, the short code and the long URL', 'Right. The short code is the lookup key, and the long URL is what the redirect returns.'),
        alt('page', 'A copy of the destination page', 'wrong', 'You only redirect; there is nothing to copy.'),
        alt('user', 'Only the long URL, no code', 'wrong', 'You need the code to find it.'),
      ], ['Add created time or expiry later if links should lapse.'], 'Design the table for a URL shortener with id, short_code (unique, indexed), long_url and created_at.'),
    ],
    hash: [
      step('length', 'How long should the code be?', 'With roughly 365 billion links over ten years, how many base-62 characters do you need?', [
        best('seven', 'Seven: 62^7 is about 3.5 trillion', 'Right. Seven characters cover the target with room to spare; six (56 billion) would not.'),
        alt('five', 'Five: 62^5 is plenty', 'wrong', 'That is only about 916 million combinations.'),
        alt('twenty', 'Twenty, to be safe', 'ok', 'Works but defeats the point of a short URL.'),
      ], ['Compute n so that 62^n covers the number of URLs you expect.'], 'Compute how many base-62 characters are needed for 365 billion URLs and show the arithmetic.'),
      step('create', 'The shortening flow', 'A user submits a long URL. What should happen first?', [
        best('exists', 'Check whether the long URL already has a short code; if not, create one and save it', 'Right. Reusing existing codes avoids duplicate rows, and creation follows the ID-then-encode steps.'),
        alt('always', 'Always create a new code', 'ok', 'Simple, but fills the table with duplicates.'),
        alt('skip', 'Skip validation to be fast', 'wrong', 'Invalid or malicious URLs would be stored and redirected to.'),
      ], ['Validate that the long URL is well formed before storing it.'], 'Write the create-short-URL handler: validate the URL, look it up, otherwise generate an ID, encode in base 62 and insert.'),
    ],
    cache: [
      step('stateless', 'Many web servers', 'One server cannot take the traffic. How do you add more?', [
        best('lb', 'Keep the web tier stateless and put a load balancer in front', 'Right. Any server can serve any request, so you add servers freely.', { add: [n('lb', 'Load balancer', 'lb', 1.25, 2, 'Spreads incoming requests across the stateless web servers.')], cut: ['u>web', 'web>u'], edges: ['u>lb', 'lb>web', 'web>>lb:302'], d: { capacity: 15, availability: 10 } }),
        alt('big', 'One much bigger server', 'wrong', 'It still has a ceiling and one failure point.'),
        alt('client', 'Let clients choose a server', 'wrong', 'Clients should not know your server layout.'),
      ], ['Web tier is stateless; all state lives in the database and cache.'], 'Make my redirect service stateless and describe how a load balancer health-checks and adds instances.'),
    ],
    analytics: [
      step('dbscale', 'The database grows', 'Billions of rows and heavy reads. How do you scale the data tier?', [
        best('rep', 'Replicate for reads and availability, then shard by key if needed', 'Right. Replicas absorb reads and give a failover target; sharding comes next when one primary cannot hold the data.', { add: [n('rep', 'DB replica', 'replica', 5, 3.5, 'A read-only copy of the URL table.')], edges: ['db>>rep'], d: { availability: 15, capacity: 10 } }),
        alt('one', 'Keep one database and add RAM', 'wrong', 'It remains a single point of failure with a ceiling.'),
        alt('shard', 'Shard first, replicate never', 'ok', 'Sharding solves size, but without replicas a shard failure loses data.'),
      ], ['Short codes hash evenly, so they make a good shard key.'], 'Add a read replica for lookups and route GET /:code to it while POST goes to the primary.'),
    ],
  },

  'web-crawler': {
    frontier: [
      step('bfs', 'Breadth-first or depth-first?', 'How should the crawler walk the web?', [
        best('bfs', 'Breadth-first with a FIFO queue', 'Right. DFS can disappear down an enormously deep path. BFS spreads out from the seeds and fits a queue.'),
        alt('dfs', 'Depth-first, to finish each site', 'wrong', 'Depth is unpredictable and can be extreme.'),
        alt('random', 'Random order', 'ok', 'Avoids depth traps but gives no control or politeness.'),
      ], ['Plain BFS ignores priority and politeness, which is why the frontier does more.'], 'Implement a BFS crawler loop with a queue and a visited set, limited by depth.'),
      step('seeds', 'Choosing seed URLs', 'The crawl needs starting points. What makes good seeds?', [
        best('diverse', 'A diverse set of popular sites, by topic or region', 'Right. Well-connected, varied seeds reach more of the web quickly.'),
        alt('one', 'One single site', 'wrong', 'You only reach what that site links to.'),
        alt('random', 'Random IP addresses', 'wrong', 'Most do not serve useful pages.'),
      ], ['Partition seeds by locality or topic.'], 'Propose a seed URL strategy for crawling news sites worldwide.'),
    ],
    polite: [
      step('priority', 'Some pages matter more', 'A forum front page changes hourly; an archive page never. How do you decide what to fetch first?', [
        best('pri', 'A prioritiser scores URLs and feeds higher-priority queues more often', 'Right. Score by usefulness (for example PageRank, traffic, update frequency) and pull from high-priority queues with a bias.', { add: [n('pri', 'Prioritizer', 'trend', 1.8, 0.5, 'Scores URLs by importance and places them in priority queues.')], edges: ['pri>fr'], d: { speed: 5 } }),
        alt('fifo', 'Plain first-in first-out', 'ok', 'Fair, but wastes effort on low-value pages.'),
        alt('alpha', 'Alphabetical order', 'wrong', 'Unrelated to value.'),
      ], ['Priority queues plus per-host queues together give both importance and politeness.'], 'Design a two-stage frontier: front queues by priority, back queues by host.'),
