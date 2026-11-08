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
      step('fresh', 'Pages change', 'A page you crawled last month has changed. How does the crawler know to revisit it?', [
        best('recrawl', 'Recrawl based on update history, more often for pages that change often', 'Right. Recrawling everything is impossible, so adapt frequency to how often each page changes.'),
        alt('never', 'Never revisit', 'wrong', 'The index goes stale.'),
        alt('all', 'Recrawl everything daily', 'wrong', 'Far too expensive for billions of pages.'),
      ], ['Use HTTP headers such as Last-Modified and ETag to check cheaply.'], 'Implement conditional GET with ETag and a per-URL recrawl interval adjusted by observed change rate.'),
    ],
    dedupe: [
      step('traps', 'Spider traps', 'A calendar page links to “next month” forever. How do you stop the crawler getting lost?', [
        best('limit', 'Cap URL length and depth, filter known patterns, and allow manual blocklists', 'Right. Traps generate endless valid-looking URLs, so guard rails keep the crawler finite.'),
        alt('trust', 'Trust every link', 'wrong', 'The crawler could follow it forever.'),
        alt('ignore', 'Ignore all dynamic links', 'wrong', 'You would miss large parts of the web.'),
      ], ['Also validate HTML: much of the web is malformed.'], 'Add URL length, depth and repeated-pattern limits to my crawler to avoid spider traps.'),
    ],
    scale: [
      step('extend', 'New content types', 'Next year you also need images and PDFs. How should the design allow that?', [
        best('plug', 'Make parsing and processing pluggable modules after the downloader', 'Right. New content types become new modules, not redesigns.', { add: [n('mod', 'Pluggable modules', 'layers', 6.1, 4.2, 'Extra processors for new content types such as images or PDFs.')], edges: ['cs>>mod'], d: { complexity: 5 } }),
        alt('hard', 'Hard-code HTML handling', 'wrong', 'Every new type needs invasive changes.'),
        alt('fork', 'Build a separate crawler per type', 'ok', 'Works, but duplicates all the crawling logic.'),
      ], ['Extensibility is one of the four design goals: scalable, robust, polite, extensible.'], 'Define a ContentProcessor interface and register processors for HTML, images and PDFs in a crawler pipeline.'),
    ],
  },

  notifications: {
    providers: [
      step('contacts', 'Where is the contact info?', 'To send a push, SMS or email you need an address. Where do they live?', [
        best('tables', 'A user table for email and phone, and a device-token table for push', 'Right. A user can have several devices, so tokens get their own table keyed by user.', { add: [n('udb', 'User DB', 'db', 2, 0.5, 'Holds emails, phone numbers and push device tokens per user.')], edges: ['ns>udb'], d: { complexity: 5 } }),
        alt('hard', 'Pass addresses in each request', 'ok', 'Every caller must know them, and they go stale.'),
        alt('none', 'Do not store any', 'wrong', 'There is nobody to send to.'),
      ], ['Collect device tokens and contact details at signup or app install.'], 'Design a users table and a device_tokens table (user_id, token, platform, last_seen) for push notifications.'),
      step('triggers', 'What starts a notification?', 'Notifications can come from other services or on a schedule. Which fits a shipping update?', [
        best('event', 'A service event, sent to the notification system as a request', 'Right. Events from other services are the usual trigger; scheduled jobs handle reminders and digests.'),
        alt('poll', 'The notification system polls every service constantly', 'wrong', 'Wasteful and slow.'),
        alt('manual', 'Staff send each one by hand', 'wrong', 'Does not scale.'),
      ], ['Both client apps and server-side schedulers can trigger notifications.'], 'Define the API a service calls to send a notification: user, type, template, parameters.'),
    ],
    reliable: [
      step('dedupe', 'Avoiding duplicates', 'A retry resends a notification that actually went out. How do you avoid annoying the user?', [
        best('eventid', 'Give every notification an event ID and check it before sending', 'Right. A seen ID means skip. Duplicates can never be fully ruled out, but this removes most.'),
        alt('none', 'Accept duplicates', 'ok', 'Fine for low-stakes messages, bad for payment alerts.'),
        alt('never', 'Never retry', 'wrong', 'You would lose notifications on any failure.'),
      ], ['Exactly-once delivery is not realistic with third-party providers.'], 'Add an event_id uniqueness check before calling the provider, and a TTL for stored IDs.'),
    ],
    prefs: [
      step('limit', 'Do not flood a user', 'A bug fires 50 notifications at one user in a minute. What protects them?', [
        best('rl', 'A per-user rate limit on notifications', 'Right. Capping frequency prevents floods and keeps users from turning notifications off.', { add: [n('rlim', 'Rate limiter', 'gauge', 1, 3, 'Limits how many notifications one user receives in a period.')], edges: ['rlim>ns'], d: { availability: 5 } }),
        alt('none', 'Trust upstream services', 'wrong', 'Bugs happen.'),
        alt('delete', 'Delete the user’s tokens', 'wrong', 'That silences them completely.'),
      ], ['Combine with preferences: users choose what they receive.'], 'Add a per-user, per-hour cap on push notifications with a suppressed counter metric.'),
      step('events', 'Did it work?', 'You sent a million notifications. How do you learn what happened?', [
        best('track', 'Record events: sent, delivered, opened, clicked', 'Right. Analytics tell you what works, and monitoring the queues tells you when to scale.', { add: [n('ev', 'Event tracking', 'chart', 1, 4.9, 'Records what happened to each notification, from sent to clicked.')], edges: ['ns>>ev'], d: { speed: 0, complexity: 5 } }),
        alt('guess', 'Guess from revenue', 'wrong', 'Too indirect.'),
        alt('none', 'Do not measure', 'wrong', 'You cannot improve what you cannot see.'),
      ], ['Monitor queued notifications: a growing queue means add workers.'], 'Log notification lifecycle events with IDs and write a query for open rate by notification type.'),
    ],
  },

  'news-feed': {
    two: [
      step('auth', 'Who can call these APIs?', 'Publishing and reading are user-specific. What must web servers do on every call?', [
        best('auth', 'Authenticate the user, and apply rate limits', 'Right. Identity decides whose feed to read and who may post, and limits stop abuse.'),
        alt('trust', 'Trust the user ID in the request', 'wrong', 'Anyone could read or post as someone else.'),
        alt('none', 'Skip auth for speed', 'wrong', 'It is a basic requirement.'),
      ], ['Use an auth token on both endpoints.'], 'Add token authentication and per-user rate limiting middleware to my feed API.'),
    ],
    fanout: [
      step('graph', 'Who are my friends?', 'Fan-out needs the list of a user’s friends. Where does it come from?', [
        best('gdb', 'A graph or friendship store, with hot data cached', 'Right. Friend lists are read at every fan-out, so a fast store and cache matter.', { add: [n('gdb', 'Graph DB', 'ring', 6, 0.2, 'Stores who follows or is friends with whom.')], edges: ['fo>gdb:friend IDs'], d: { complexity: 5 } }),
        alt('scan', 'Scan all posts', 'wrong', 'Far too slow.'),
        alt('client', 'Ask the client to send its friends', 'wrong', 'Not trustworthy.'),
      ], ['Filter out muted or blocked friends before pushing.'], 'Design the friendship table and a cached friend-ID lookup used by the fan-out service.'),
    ],
    cache: [
      step('retrieve', 'Reading the feed', 'A user opens the app. What happens?', [
        best('hydrate', 'Fetch post IDs from the feed cache, then hydrate them from content and user caches', 'Right. IDs are cheap to store and fetch; full content comes from separate caches.'),
        alt('db', 'Query every friend’s posts from the database', 'wrong', 'Too many queries per open.'),
        alt('html', 'Rebuild the whole feed from scratch', 'ok', 'Correct but slow.'),
      ], ['Return the newest posts first and paginate.'], 'Write the feed read path: get 20 post IDs, batch-fetch posts and authors, return JSON with a cursor.'),
    ],
    scale: [
      step('notify', 'Tell friends about it', 'Besides filling feeds, a post may notify friends. Where does that happen?', [
        best('ntf', 'A separate notification service called after publishing', 'Right. It is a different job with its own scaling and failure modes, so it runs on its own.', { add: [n('ntf', 'Notification service', 'bell', 2.8, 0.5, 'Sends push and in-app notifications about new posts.')], edges: ['post>>ntf'], d: { complexity: 5 } }),
        alt('inline', 'Inside the post request', 'wrong', 'Slows publishing and couples the two.'),
        alt('none', 'Never notify', 'ok', 'Possible but limits engagement.'),
      ], ['Paginate feeds and cache by cursor.'], 'Publish a post-created event to a queue consumed by notification and fan-out workers separately.'),
    ],
  },

  chat: {
    proto: [
      step('stateless', 'Which services are stateless?', 'Chat servers hold connections. What about login, profiles and group management?', [
        best('split', 'Stateless request-response services behind a load balancer; only chat servers are stateful', 'Right. Keep state where you must (connections) and nowhere else, so most services scale easily.', { add: [n('api', 'API servers', 'server', 0, 3, 'Stateless services for login, profile and groups.')], edges: ['a>api:login, groups'], d: { capacity: 10 } }),
        alt('all', 'Make everything stateful', 'wrong', 'Needless coupling and harder scaling.'),
        alt('one', 'Put everything in the chat server', 'wrong', 'One big stateful monolith.'),
      ], ['Only connection-holding servers need to be stateful.'], 'Split my chat backend into a stateless API service and a stateful WebSocket gateway.'),
    ],
    route: [
      step('ids', 'Ordering messages', 'Two messages arrive close together. How do you keep them in order within a conversation?', [
        best('seq', 'A sequence number that increases within each chat', 'Right. Order matters per conversation, so IDs need only be sortable within a chat, not globally unique in time.'),
        alt('clock', 'Client timestamps', 'wrong', 'Clocks differ between devices.'),
        alt('rand', 'Random IDs', 'wrong', 'No order.'),
      ], ['A local sequence generator per channel is enough.'], 'Generate per-channel increasing message IDs using a counter in the database or Redis.'),
      step('group', 'Group chat', 'A message to a group of 50 must reach each member. How do you deliver?', [
        best('inbox', 'Copy the message into each member’s inbox queue', 'Right. Fine for small groups (about 100), and each member syncs from their own queue.'),
        alt('poll', 'Everyone polls the group record', 'ok', 'Simple but slow and chatty.'),
        alt('email', 'Send each one by email', 'wrong', 'Not real-time.'),
      ], ['For huge groups, switch to fetch-on-demand.'], 'Implement group delivery by writing a message to every member’s inbox and notifying their connected servers.'),
    ],
    store: [
      step('devices', 'Multiple devices', 'One person uses a phone and a laptop. How does each stay in sync?', [
        best('cursor', 'Each device tracks the last message ID it has seen, and syncs the rest', 'Right. A per-device cursor lets every device catch up independently.'),
        alt('one', 'Only the newest device gets messages', 'wrong', 'The other device misses everything.'),
        alt('copy', 'Copy the full history on every login', 'ok', 'Correct but wasteful.'),
      ], ['Cursor = max message ID seen on that device.'], 'Add per-device last-seen message IDs and a sync endpoint returning messages after a given ID.'),
    ],
    presence: [
      step('presence-fan', 'Telling friends you are online', 'Your status changes. Who needs to know?', [
        best('subs', 'Only friends who are currently online and watching, via pub/sub', 'Right. A channel per user: friends subscribe on connect. For huge groups, fetch presence on demand instead.'),
        alt('all', 'Broadcast to everyone', 'wrong', 'Wasteful.'),
        alt('none', 'Nobody until they ask', 'ok', 'Cheap but stale.'),
      ], ['Fan-out cost grows with friends; limit it for big groups.'], 'Publish presence changes to a per-user channel and subscribe friends’ chat servers on connect.'),
    ],
  },

  autocomplete: {
    trie: [
      step('topk', 'Finding the top five', 'In the trie, a prefix node has thousands of descendants. How do you return the top five quickly?', [
        best('cache', 'Store the top-k list at each node', 'Right. The answer is precomputed, so a query is just walk the prefix and read the list.'),
        alt('walk', 'Walk and sort all descendants on each request', 'wrong', 'Far too slow for per-keystroke queries.'),
        alt('db', 'Query SQL with ORDER BY', 'wrong', 'Scans and sorts a huge table each time.'),
      ], ['Trade-off: more memory for top-k caches in exchange for speed.'], 'Extend my trie nodes with a precomputed top-5 list and update it when frequencies change.'),
      step('limit', 'How long is a prefix?', 'Users rarely type more than 50 characters. How does that help?', [
        best('cap', 'Cap the prefix length, so the trie stays shallow and lookups are constant-ish', 'Right. A depth limit bounds memory and lookup time.'),
        alt('inf', 'Support unlimited prefix length', 'ok', 'Correct but wastes memory on rare long queries.'),
        alt('one', 'Only index first letters', 'wrong', 'Suggestions would be useless.'),
      ], ['Use AJAX requests so the page does not reload.'], 'Enforce a maximum indexed prefix length of 50 and trim longer queries.'),
    ],
    build: [
      step('filter', 'Removing bad suggestions', 'Some suggestions are hateful or illegal. How do you keep them out?', [
        best('filter', 'A filter layer between the data and the trie that removes unwanted entries', 'Right. Filtering at build time keeps them out of results and can react to reports.', { add: [n('filt', 'Filter', 'filter', 5.7, 1.2, 'Removes hateful, unsafe or unwanted queries before they reach the trie.')], edges: ['filt>>t'], d: { availability: 5 } }),
        alt('trust', 'Trust users', 'wrong', 'Bad suggestions will appear.'),
        alt('manual', 'Review every suggestion by hand', 'wrong', 'Impossible at scale.'),
      ], ['Delete in the trie cache and the database when a suggestion is reported.'], 'Add a blocklist filter to my trie builder and a hot-reload for new blocked terms.'),
    ],
    speed: [
