import type { Step } from '../types'
import { alt, best, n, step } from './dsl'

export type Extras = Record<string, Record<string, Step[]>>

export const extras1: Extras = {
  framework: {
    scope: [
      step('questions', 'Which questions are worth asking?', 'You may ask a handful of questions. Which ones help most?', [
        best('good', 'Features, who the users are, the scale, and any constraints', 'Right. Those four decide the architecture: what to build, for whom, how big, and within what limits.', { add: [n('req', 'Requirements', 'filter', 0.4, 3.4, 'The agreed list of features, users, scale and constraints.')], edges: ['scope>req'] }),
        alt('one', 'Only repeat back the one feature in the question', 'wrong', 'You learn nothing new, and miss the scale and constraints that drive the design.'),
        alt('bio', 'Ask about the interviewer’s experience', 'wrong', 'Friendly, but it does not clarify the problem.'),
      ], ['Example questions: mobile or web? Which features matter? How many users now and in a year? Is there existing infrastructure to reuse?'], 'List ten clarifying questions for “design a chat app”, grouped into features, scale, constraints and non-functional needs.'),
      step('assume', 'Where do assumptions go?', 'You decide a few things yourself, such as “friends lists are capped at 5,000”. What do you do with them?', [
        best('write', 'Write them down where both of you can see them', 'Right. Written assumptions can be challenged, corrected, and referred back to when you estimate.', { add: [n('as', 'Assumptions', 'doc', 0.4, 4.4, 'A visible list of the guesses your design stands on.')], edges: ['req>as'] }),
        alt('keep', 'Keep them in your head', 'wrong', 'Unstated assumptions cause silent disagreements and mistakes in your numbers.'),
        alt('skip', 'Avoid assuming anything and wait to be told', 'ok', 'Cautious, but some assumptions are inevitable. Say them out loud instead.'),
      ], ['Write them where you can reuse them in the back-of-the-envelope estimate.'], 'Turn these requirements into a numbered list of explicit assumptions with units, ready to use in an estimate.'),
    ],
    hld: [
      step('estimate', 'Do you need numbers?', 'The blueprint is drawn. Should you estimate traffic and storage now?', [
        best('yes', 'Yes: a quick back-of-the-envelope check of QPS and storage', 'Right. Rough numbers tell you whether one database is enough or whether caching and sharding are needed, before you commit to the design.', { add: [n('est', 'Estimates', 'chart', 2.2, 3.4, 'Rough QPS, storage and bandwidth numbers used to sanity-check the design.')], edges: ['design>est'] }),
        alt('no', 'No, estimates are guesses', 'wrong', 'Guesses with units are far better than none: they steer the design.'),
        alt('exact', 'Yes, but compute exact figures', 'wrong', 'Precision is not expected; round numbers and show the method.'),
      ], ['Only estimate when the interviewer wants it. Ask first.'], 'Estimate QPS, peak QPS and 5-year storage for a news feed with 10 million daily users, showing each assumption.'),
      step('usecases', 'Walk through the use cases', 'You have boxes and arrows. How do you check they are right?', [
        best('walk', 'Walk each main use case through the design end to end', 'Right. Following “publish a post” and “read my feed” step by step reveals missing components and wrong arrows.', { add: [n('uc', 'Use cases', 'send', 2.2, 0.6, 'The main flows traced through the blueprint to find gaps.')], edges: ['design>>uc'] }),
        alt('trust', 'Trust that the boxes look right', 'wrong', 'Gaps only show up when something actually flows through.'),
        alt('edge', 'Start with the rarest edge cases', 'premature', 'Cover the main flows first. Edge cases come later.'),
      ], ['Two flows for a feed: publishing and retrieval.'], 'Trace “user publishes a post” and “user opens feed” through my design as numbered steps, and list any component the flows reveal is missing.'),
    ],
    deep: [
      step('bottlenecks', 'Name the bottlenecks', 'You are deep in one component. What else belongs in this phase?', [
        best('bn', 'Say where it could fail or slow down, and how you would fix it', 'Right. Naming bottlenecks and proposing fixes is the heart of the deep dive.', { add: [n('bn', 'Bottlenecks', 'gauge', 3.9, 3.4, 'Where the design could fail or slow down, with proposed mitigations.')], edges: ['deep>bn'] }),
        alt('perfect', 'Claim the design has no bottlenecks', 'wrong', 'Every design has limits. Admitting them shows judgment.'),
        alt('later', 'Leave it to the wrap-up', 'ok', 'Wrap-up is a good place to revisit them, but discussing them in context is stronger.'),
      ], ['Balance detail: avoid over-engineering.'], 'List the likely bottlenecks in a news feed fan-out design and one mitigation for each.'),
    ],
    wrap: [
      step('time', 'Managing the clock', 'You have 45 minutes. How do you split them?', [
        best('split', 'Roughly: scope 5-10, high-level 10-15, deep dive 10-25, wrap-up 3-5', 'Right. Most of the time goes to design and depth; scope and wrap-up are short but never skipped.'),
        alt('diagram', 'Spend 30 minutes perfecting the diagram', 'wrong', 'You will have no time for the deep dive, which is where depth shows.'),
        alt('rush', 'Spend 2 minutes on scope to save time', 'wrong', 'Rushing scope risks designing the wrong thing.'),
      ], ['Keep the interviewer in the loop: do not go silent.'], 'Draft a 45-minute plan for a system design interview with time boxes and what to say in each.'),
    ],
  },

  'rate-limiter': {
    place: [
      step('rules', 'Where do the limits come from?', 'Different APIs need different limits. Where does the limiter learn them?', [
        best('config', 'Rules in a config store, loaded and cached by the limiter', 'Right. Rules are data, not code: changing a limit does not need a deploy, and caching keeps checks fast.', { add: [n('rules', 'Rules', 'doc', 2.5, 0.5, 'Config describing the limit per API, user or client, such as 100 requests per minute.')], edges: ['rules>rl'] }),
        alt('hard', 'Hard-code limits in the source', 'ok', 'Works at first but every change needs a deploy.'),
        alt('db', 'Ask the database for the rule on every request', 'wrong', 'Adds a slow lookup to the hottest path.'),
      ], ['Rules often live as files on disk, pulled into a cache.'], 'Design a YAML rules format for per-endpoint, per-user rate limits and a loader that caches it.'),
    ],
    algo: [
      step('bucket', 'Sizing a token bucket', 'You chose a token bucket. What do its two numbers control?', [
        best('size', 'Bucket size sets the allowed burst; refill rate sets the sustained average', 'Right. A bucket of 10 refilling at 1 per second allows 10 at once, then one per second.'),
        alt('swap', 'Bucket size is the average rate; refill rate is the burst', 'wrong', 'The other way around.'),
        alt('one', 'Only one number matters', 'wrong', 'You need both to describe burst and average.'),
      ], ['Different endpoints often get different buckets, and sometimes buckets per user or per IP.'], 'For a token bucket allowing 5 requests/second with bursts of 20, what are the bucket size and refill rate, and what happens after 30 requests in one second?'),
      step('fixedwin', 'Why fixed windows leak', 'A fixed-window counter allows 5 requests per minute. A client sends 5 at 0:59 and 5 at 1:01. What happened?', [
        best('burst', 'Ten requests passed in two seconds: bursts across a window edge double the rate', 'Right. That is the known weakness of fixed windows, and why sliding windows exist.'),
        alt('fine', 'Nothing wrong: each window allowed 5', 'wrong', 'Each window is fine, but the real rate over those two seconds is double the limit.'),
        alt('block', 'The second batch is blocked', 'wrong', 'It is in a new window, so it is allowed.'),
      ], ['Sliding window log fixes it exactly (memory heavy); sliding window counter fixes it approximately (memory light).'], 'Simulate a fixed-window limiter and a sliding-window counter against a burst at the window boundary and compare the results.'),
    ],
    store: [
      step('ttl', 'Counters must forget', 'Redis holds a counter per client per window. What stops them piling up forever?', [
        best('expire', 'Give every counter key an expiry', 'Right. Keys vanish when their window is over, so memory stays bounded without a cleanup job.'),
        alt('manual', 'Run a nightly cleanup script', 'ok', 'Works, but memory grows all day and the script is more to maintain.'),
        alt('never', 'Keep them for audit', 'wrong', 'Counters are not an audit log, and memory is finite.'),
      ], ['INCR plus EXPIRE is the classic pair, but see the race condition in the next steps.'], 'Show how to set a counter key with a 60 second expiry in Redis atomically, so the key is never created without a TTL.'),
    ],
    race: [
      step('multi', 'Many limiter instances', 'You run several gateways, each with its own limiter. A client’s requests spread across them. How do they share counts?', [
        best('shared', 'All instances use the same central counter store', 'Right. One shared source of truth means the client’s total is counted regardless of which gateway it hit.', { add: [n('rl2', 'Rate limiter B', 'gauge', 2.5, 3.4, 'A second limiter instance. It reads and writes the same Redis counters as the first.')], edges: ['u>rl2', 'rl2>api', 'rl2>r'] }),
        alt('local', 'Each instance keeps its own counts', 'wrong', 'A client can use the full limit on every instance.'),
        alt('sync', 'Instances broadcast counts to each other', 'ok', 'Possible but chatty and eventually consistent.'),
      ], ['Another option: sticky routing so one client always hits the same limiter.'], 'Explain two ways to keep rate-limit counts consistent across multiple gateway instances and their trade-offs.'),
    ],
    reply: [
      step('monitor', 'Are the rules right?', 'The limiter is live. How do you know whether limits are too strict or too loose?', [
        best('watch', 'Monitor allowed versus blocked requests and tune the rules', 'Right. Too many blocked good users means the rules are too strict; abuse getting through means too loose.', { add: [n('mon', 'Monitoring', 'chart', 5, 0.5, 'Dashboards of allowed and blocked requests per rule.')], edges: ['rl>>mon:metrics'] }),
        alt('set', 'Set limits once and forget them', 'wrong', 'Traffic patterns change.'),
        alt('guess', 'Wait for angry emails', 'wrong', 'You find out too late, and only about one failure mode.'),
      ], ['Track blocked rate per rule and per client.'], 'Add allowed/blocked counters per rule to my rate limiter and a dashboard query showing the blocked ratio.'),
    ],
  },

  'consistent-hashing': {
    rehash: [
      step('space', 'How big is the ring?', 'You place servers and keys on a ring. How large should the hash space be?', [
        best('big', 'A huge fixed circle, such as 0 to 2^160-1 with SHA-1', 'Right. A vast space makes collisions between positions vanishingly rare, and the ring never changes size when servers come and go.'),
        alt('small', 'Exactly as many positions as servers', 'wrong', 'Then adding a server means resizing the ring: the modulo problem again.'),
        alt('grow', 'A ring that grows with the cluster', 'wrong', 'Changing the space moves keys, defeating the point.'),
      ], ['Both servers and keys use the same hash function.'], 'Hash server names and 10 sample keys onto a 2^32 ring with a hash function and print their positions in order.'),
    ],
    lookup: [
      step('fast', 'Looking it up quickly', 'A lookup must find the first server clockwise from a key. How do you do it fast with thousands of virtual nodes?', [
        best('sorted', 'Keep positions in a sorted structure and binary-search for the next one', 'Right. A sorted array or tree finds the successor in logarithmic time.'),
        alt('scan', 'Scan every server position on each lookup', 'ok', 'Correct but linear, which hurts with many virtual nodes.'),
        alt('rehash', 'Re-hash the key until it lands on a server', 'wrong', 'Not how a ring works, and not deterministic.'),
      ], ['Wrap around: past the last position, go to the first.'], 'Implement ring lookup with binary search including wrap-around from the largest position to the smallest.'),
    ],
    add: [
      step('migrate', 'Moving the keys safely', 'Server 4 joins and must take over a key range. How do you move data without losing reads?', [
        best('copy', 'Copy the range to the new server, then switch routing, then clean up the old copy', 'Right. Keeping the old copy until the new one is ready means reads never see a gap.'),
        alt('cut', 'Switch routing first, copy later', 'wrong', 'Reads for that range miss until the copy finishes.'),
        alt('stop', 'Stop the cluster while moving', 'wrong', 'Downtime to avoid a copy problem is a bad trade.'),
      ], ['Only the new server’s predecessor range moves, so the transfer is small.'], 'Describe a safe key-range migration when adding a node to a consistent-hash cluster, including how clients keep working.'),
    ],
    remove: [
      step('replicas-ring', 'Not losing data when a server dies', 'A cache can refetch lost data, but a store cannot. How does a ring help store data durably?', [
        best('next-n', 'Copy each key to the next N servers clockwise', 'Right. The successors already own the neighbouring range, so when a server dies, replicas are right where lookups will land.'),
        alt('one', 'Keep a single copy and hope', 'wrong', 'One failed server loses its range for good.'),
        alt('all', 'Copy every key to every server', 'wrong', 'Wasteful and slow to write.'),
      ], ['Pick distinct physical servers, not several virtual nodes of the same machine.'], 'Extend my hash ring to return N distinct physical servers for each key, skipping virtual nodes of a machine already chosen.'),
    ],
    vnodes: [
      step('vcount', 'How many virtual nodes?', 'More virtual nodes balance better. What limits how many you use?', [
        best('trade', 'The metadata to store and look up grows with the count, so choose enough to balance without bloating', 'Right. Around 100-200 per server is common: the load variation shrinks as the count grows.'),
        alt('inf', 'As many as possible, without limit', 'wrong', 'Memory and lookup cost grow with every virtual node.'),
        alt('one', 'One per server is enough', 'wrong', 'That is the uneven basic ring.'),
      ], ['Standard deviation of load shrinks as virtual nodes increase.'], 'Measure the standard deviation of keys per server for 1, 10, 100 and 1000 virtual nodes per server.'),
      step('hotkey', 'One key is on fire', 'Even with a perfectly balanced ring, one celebrity key gets a million reads a second. Does the ring help?', [
        best('no', 'No: the ring balances keys, not their traffic. Replicate or split the hot key', 'Right. Hot keys need their own treatment: replicas, local caching, or splitting the key.'),
        alt('yes', 'Yes, virtual nodes solve all imbalance', 'wrong', 'They balance key counts, not per-key traffic.'),
        alt('ignore', 'Ignore it', 'wrong', 'That server melts.'),
      ], ['Real systems using rings: DynamoDB, Cassandra, Discord, Akamai CDN, Maglev.'], 'Design a hot-key mitigation for a cache cluster using consistent hashing: detect, replicate, and route reads.'),
    ],
  },

  'key-value': {
    partition: [
      step('api', 'What does the store offer?', 'A key-value store is deliberately simple. What is the core API?', [
        best('getput', 'put(key, value) and get(key), with small values', 'Right. A tiny surface lets the system focus on scale and speed. Values are small (typically under 10 KB).'),
        alt('sql', 'Full SQL with joins', 'wrong', 'That is a different kind of database.'),
        alt('files', 'Store large files as values', 'wrong', 'Big blobs belong in object storage.'),
      ], ['Single-server version: a hash table in memory, with compression or disk tiers to stretch it.'], 'Define the get/put/delete API and size limits for a key-value store, and a single-node hash-table implementation.'),
    ],
    replicate: [
      step('cap', 'Choosing in a network split', 'A network failure splits the cluster in two. Both halves are alive. What must you choose between?', [
        best('cp-ap', 'Consistency or availability: refuse some requests, or answer with possibly stale data', 'Right. That is the CAP theorem: with a partition, you cannot have both. Banks lean to consistency; many web systems to availability.', { d: { availability: 5 } }),
        alt('both', 'You can keep both with enough replicas', 'wrong', 'Replicas do not change the theorem: during a partition one side cannot know the other’s writes.'),
        alt('drop', 'Pick partition tolerance off', 'wrong', 'Networks do partition, so real systems must tolerate it.'),
      ], ['CP: consistent but may be unavailable. AP: available but may be inconsistent.'], 'Explain CAP with an example of a write during a partition, and what a CP versus an AP system would do.'),
    ],
    quorum: [
      step('models', 'Consistency models', 'What do “strong”, “weak” and “eventual” consistency mean for a read?', [
        best('defs', 'Strong: latest write always. Weak: may be stale. Eventual: stale for a while, then converges', 'Right. Stronger guarantees cost latency and availability.'),
        alt('same', 'They are different names for the same thing', 'wrong', 'They are different guarantees with different costs.'),
        alt('eventual', 'Eventual means data may be lost', 'wrong', 'It converges; it just may disagree for a while.'),
      ], ['Dynamo and Cassandra favour eventual consistency; configurable quorums let you tune it.'], 'Describe a timeline where an eventually consistent read returns stale data and when it finally converges.'),
    ],
    conflict: [
