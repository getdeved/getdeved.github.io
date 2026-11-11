import { alt, best, n, step } from './dsl'
import type { Extras } from './extras1'

export const extras3: Extras = {
  proximity: {
    split: [
      step('apis', 'What does a search request carry?', 'A user asks for nearby businesses. What parameters does the API need?', [
        best('params', 'Latitude, longitude and a radius, with a sensible default and maximum', 'Right. Location plus radius defines the search circle; a cap on radius stops absurdly large queries.'),
        alt('city', 'Only a city name', 'wrong', 'Too coarse for “within 500 m”.'),
        alt('none', 'No parameters, the server guesses', 'wrong', 'It cannot know where you are.'),
      ], ['Response: a paginated list of business IDs with basic info; details come from a separate call.'], 'Define GET /search/nearby with latitude, longitude, radius (default 5 km, max 20 km) and pagination.'),
      step('schema', 'Two tables', 'Businesses are rarely edited, but are searched constantly. How do you store them?', [
        best('two', 'A business table for details, and a separate geospatial index table for search', 'Right. The search index is optimised for location lookups; details are fetched by ID afterwards.'),
        alt('one', 'One wide table for everything', 'ok', 'Simple, but search indexes and detail rows have different access patterns.'),
        alt('text', 'Store addresses only as text', 'wrong', 'You cannot search by distance on text.'),
      ], ['Search is read-heavy; the index can be rebuilt nightly from the business table.'], 'Design a business table and a geospatial_index table (geohash, business_id) and the query joining them.'),
    ],
    naive: [
      step('grid', 'Divide the world into a grid', 'You cut the map into equal squares and index businesses by square. What goes wrong?', [
        best('dense', 'City squares hold millions of places while rural ones hold none: uneven load', 'Right. Evenly sized cells ignore density. Adaptive structures such as quadtrees handle this better.'),
        alt('fine', 'Nothing, a grid is ideal', 'wrong', 'Density varies enormously.'),
        alt('slow', 'Grids cannot be indexed', 'wrong', 'They can; the issue is uneven distribution.'),
      ], ['A quadtree splits a cell into four until each holds few points.'], 'Compare a fixed grid and a quadtree for storing 200 million places, with memory and query trade-offs.'),
    ],
    geohash: [
      step('precision', 'How precise a geohash?', 'A geohash can be 1 to 12 characters. How do you pick the length?', [
        best('radius', 'Choose the shortest length whose cell is at least as big as the search radius', 'Right. A longer hash means a smaller cell. Match the cell size to the radius, then include neighbours.'),
        alt('max', 'Always the longest', 'wrong', 'Cells are tiny and you would query countless neighbours.'),
        alt('min', 'Always the shortest', 'wrong', 'Huge cells return far too many results.'),
      ], ['Roughly: 4 characters about 20 km, 5 about 5 km, 6 about 1.2 km.'], 'Map a search radius to a geohash length using a table of cell sizes.'),
      step('quad', 'Quadtree or S2?', 'Geohash is simple. When would you reach for a quadtree or Google S2?', [
        best('adaptive', 'When density varies a lot or you need k-nearest search; S2 for more accurate cells', 'Right. Quadtrees adapt to density and are held in memory; S2 maps the globe to cells along a space-filling curve.'),
        alt('never', 'Never, geohash is always best', 'wrong', 'It has boundary and uniformity limits.'),
        alt('always', 'Always, geohash is obsolete', 'wrong', 'Geohash is easy to maintain and fine for many cases.'),
      ], ['Quadtrees take more work to update; geohash updates are easy because a business belongs to one cell.'], 'Build a simple in-memory quadtree for points and a k-nearest query.'),
    ],
    scale: [
      step('replicas', 'Read replicas for search', 'The index is read constantly. How do you keep up and survive failures?', [
        best('rep', 'Replicate the database and spread reads across the replicas', 'Right. The dataset is modest, so replication for load and failover is simpler than sharding.', { add: [n('rep', 'DB replica', 'replica', 6.1, 2, 'A read-only copy of the business and index data.')], edges: ['db>>rep'], d: { availability: 15 } }),
        alt('one', 'One database', 'wrong', 'A single point of failure under peak load.'),
        alt('shard', 'Shard by hotel id', 'wrong', 'Wrong domain. Here you would shard by region or geohash if you must.'),
      ], ['200 million businesses at about 1 KB each is a few hundred GB: replication fits.'], 'Route searches to read replicas and business edits to the primary, and describe replica lag effects.'),
    ],
  },

  'nearby-friends': {
    push: [
      step('periodic', 'How often to send?', 'Phones report their location. How often?', [
        best('30s', 'Periodically, such as every 30 seconds', 'Right. Often enough to feel live, rarely enough to save battery and server load.'),
        alt('rt', 'Continuously every second', 'wrong', 'Drains batteries and multiplies load.'),
        alt('manual', 'Only when the user opens the app', 'ok', 'Cheap, but friends see stale positions.'),
      ], ['10 million users every 30 seconds is about 334,000 updates per second.'], 'Add a periodic location reporter to my mobile client with backoff when stationary.'),
      step('init', 'Starting the app', 'The app connects. What must it do before showing friends?', [
        best('init', 'Load recent friend locations, then subscribe to their channels', 'Right. The cache gives the starting picture; the subscriptions keep it live.'),
        alt('wait', 'Wait for the first update from each friend', 'ok', 'Slow to show anything.'),
        alt('db', 'Query the history database', 'wrong', 'It is not built for this and is slow.'),
      ], ['Client initialisation: fetch friends, read their latest locations, subscribe to channels.'], 'Write the client startup sequence for nearby friends: fetch friend list, read locations from cache, subscribe.'),
    ],
    pubsub: [
      step('many', 'A user with thousands of friends', 'One user has 5,000 friends. Does every update go to all of them?', [
        best('limit', 'Only to friends who are online and in range, and cap the friend count', 'Right. Fan-out cost grows with friends, so cap the number and skip offline ones.'),
        alt('all', 'Yes, to all 5,000', 'wrong', 'Expensive and mostly wasted.'),
        alt('none', 'To none until asked', 'ok', 'Cheap, but not live.'),
      ], ['Cap friends (for example 5,000) as a product decision.'], 'Skip offline and out-of-range friends when fanning out a location update.'),
      step('addfriend', 'Adding and removing friends', 'You add a friend while the app is open. What changes?', [
        best('sub', 'Subscribe to the new friend’s channel (or unsubscribe on removal)', 'Right. Channels are cheap, so changing subscriptions live is straightforward.'),
        alt('restart', 'Restart the app', 'wrong', 'Poor experience.'),
        alt('ignore', 'Nothing until next login', 'ok', 'Stale but harmless.'),
      ], ['Unused channels cost almost no memory.'], 'Handle friendship events by subscribing or unsubscribing the connected user’s channels.'),
      step('scale-ws', 'Scaling WebSocket servers', 'More users means more WebSocket servers. What is tricky about removing one?', [
        best('drain', 'Drain it gracefully: stop new connections and let existing ones move over', 'Right. Connections are stateful, so you cannot kill a server instantly without dropping users.', { add: [n('ws2', 'WebSocket servers B', 'wifi', 2.9, 3.5, 'More stateful servers. They must be drained, not killed, when scaled down.')], edges: ['lb>ws2', 'ws2>lc', 'ws2>>ps'], d: { capacity: 15 } }),
        alt('kill', 'Kill it immediately', 'wrong', 'Users are disconnected abruptly.'),
        alt('never', 'Never scale down', 'ok', 'Wasteful.'),
      ], ['Same idea as a rolling deploy.'], 'Implement graceful draining: stop accepting new sockets, tell clients to reconnect elsewhere, then exit.'),
    ],
    range: [
      step('userdb', 'The user and friend database', 'Users and friendships grow large. How do you scale that store?', [
        best('shard', 'Shard by user ID, and expose it behind a service', 'Right. User-keyed data shards naturally, and a service in front hides the layout.', { add: [n('udb', 'User DB', 'db', 6.1, 2, 'Users and friendships, sharded by user ID.')], edges: ['api>udb'], d: { capacity: 10 } }),
        alt('one', 'One database', 'ok', 'Fine at first.'),
        alt('cache', 'Only a cache', 'wrong', 'Not durable.'),
      ], ['Occasional dropped location updates are acceptable; friend data is not.'], 'Shard the friendships table by user_id and write the query for a user’s friend IDs.'),
    ],
  },

  maps: {
    tiles: [
      step('zoom', 'Zoom levels', 'The map looks different zoomed out than zoomed in. How are tiles organised?', [
        best('levels', 'A separate set of tiles per zoom level, each level roughly four times as many', 'Right. Each zoom step divides every tile into four. Clients request only the level they need.'),
        alt('one', 'One set of tiles scaled in the browser', 'wrong', 'Blurry or huge.'),
        alt('render', 'Render everything on the server for each request', 'wrong', 'Expensive and uncacheable.'),
      ], ['At zoom 21 there are about 4.4 trillion tiles.'], 'Compute the number of tiles at zoom levels 0 to 5 and a function mapping (lat, lng, zoom) to (x, y).'),
      step('vector', 'Vector tiles', 'Image tiles are heavy. What is an alternative?', [
        best('vec', 'Vector tiles: send shapes and styles, and let the client draw them', 'Right. Smaller downloads, crisp at any zoom, and flexible styling.'),
        alt('bigger', 'Larger images', 'wrong', 'More data.'),
        alt('text', 'Text descriptions', 'wrong', 'Not a map.'),
      ], ['Vector tiles shift rendering work to the device.'], 'Compare raster and vector tiles in size, rendering cost and styling flexibility.'),
    ],
    loc: [
      step('mapdata', 'Where does the map come from?', 'Map tiles and routing graphs need source data. How are they produced?', [
        best('pipeline', 'An offline pipeline processes raw road data into tiles and routing graphs', 'Right. The heavy work happens in batch; serving then just reads precomputed files.'),
        alt('live', 'Compute everything live per request', 'wrong', 'Far too slow.'),
        alt('manual', 'Draw maps by hand', 'wrong', 'Does not scale.'),
      ], ['Pipelines run periodically and publish new tile sets.'], 'Outline a batch pipeline from raw OpenStreetMap data to vector tiles and routing tiles.'),
    ],
    route: [
      step('hier', 'Roads at different scales', 'A cross-country route does not need every back alley. How does the search skip detail?', [
        best('levels', 'Hierarchical routing tiles: local, arterial and highway levels', 'Right. Start local, climb to highways for the long stretch, descend near the destination.'),
        alt('flat', 'One flat graph', 'wrong', 'The search explores far too many small roads.'),
        alt('highway', 'Only highways', 'wrong', 'You cannot reach the destination.'),
      ], ['Roads are edges; intersections are nodes.'], 'Design three tile levels for a road graph and the rules for connecting them.'),
    ],
    eta: [
      step('reroute', 'Rerouting', 'A crash blocks your road. How does the app suggest a new route?', [
        best('nav', 'A navigation service watches ETA and asks the routing service for alternatives', 'Right. It compares the live ETA with the original and reroutes when a better path appears.', { add: [n('nav', 'Navigation service', 'nav', 5.7, 2.1, 'Tracks the trip, compares live ETA to the plan and triggers reroutes.')], edges: ['nav>sp:alternatives', 'eta>nav'], d: { availability: 5 } }),
        alt('driver', 'The driver picks a new route themselves', 'wrong', 'Defeats the purpose.'),
        alt('never', 'Never reroute', 'wrong', 'Users sit in traffic.'),
      ], ['Rerouting must be smooth: do not flip between routes constantly.'], 'Reroute only when an alternative saves more than 2 minutes, to avoid flip-flopping.'),
    ],
  },

  metrics: {
    collect: [
      step('model', 'What is a metric?', 'Before storing metrics, how do you model one?', [
        best('series', 'A name plus labels, with a series of (timestamp, value) pairs', 'Right. For example cpu.load with host=web1 and region=us. Labels make slicing easy.'),
        alt('row', 'One text log line per reading', 'ok', 'Hard to query and aggregate.'),
        alt('single', 'One current value per name', 'wrong', 'History is the point.'),
      ], ['Metrics are append-only: you add points, you rarely edit them.'], 'Define a metric data model with name, labels and points, and a query for average cpu.load by region.'),
      step('pullpush', 'Pull or push?', 'Should the system fetch metrics from sources, or should sources send them?', [
        best('both', 'Pull suits long-running services with discovery; push suits short-lived jobs', 'Right. Pull knows what should exist and spots a missing target; push is needed when a job is gone before you can scrape it.'),
        alt('pull', 'Always pull', 'ok', 'Struggles with very short-lived jobs.'),
        alt('push', 'Always push', 'ok', 'Cannot easily tell the difference between silence and failure.'),
      ], ['Service discovery tells pull collectors which targets exist.'], 'Compare pull and push metric collection with an example where each fails.'),
    ],
    queue: [
      step('agg', 'Where to aggregate', 'Aggregating before storage saves space. Where can it happen?', [
        best('where', 'In the collection agent (simple), the ingestion pipeline (stream processing), or at query time (flexible)', 'Right. Each trades simplicity, data volume and flexibility differently.'),
        alt('never', 'Never aggregate', 'wrong', 'Storage costs balloon.'),
        alt('only', 'Only in the database', 'ok', 'Possible but unreduced data still flows everywhere.'),
      ], ['Stream processors such as Flink aggregate in flight.'], 'Aggregate per-second counters into per-minute sums in a stream job before writing to the TSDB.'),
    ],
    store: [
      step('qc', 'Repeated dashboard queries', 'Fifty people open the same dashboard. Should the database answer fifty times?', [
        best('cache', 'Cache query results briefly', 'Right. Dashboards ask the same thing repeatedly; a short cache removes most load.', { add: [n('qc', 'Query cache', 'cache', 5.7, 1.6, 'Caches results of repeated dashboard queries for a short time.')], edges: ['q>qc'], d: { speed: 10 } }),
        alt('no', 'No cache, always fresh', 'ok', 'Fine at small scale.'),
        alt('manual', 'Ask users not to refresh', 'wrong', 'Not a design.'),
      ], ['Visualisation: Grafana-style dashboards over the query service.'], 'Add a 30 second cache keyed by the query text and time range to the query service.'),
    ],
    alert: [
      step('oncall', 'Who is on call?', 'An alert fires at 3am. Who receives it?', [
        best('rota', 'The on-call engineer from a rota, with escalation if they do not acknowledge', 'Right. Routing to a person and escalating ensures it is actually handled.'),
        alt('all', 'Everyone', 'wrong', 'Alert fatigue and no clear owner.'),
        alt('none', 'Nobody, check in the morning', 'wrong', 'Defeats the purpose.'),
      ], ['Group related alerts into one page.'], 'Define an escalation policy: page the primary, wait 10 minutes, then the secondary.'),
    ],
  },

  'ad-clicks': {
    ingest: [
      step('query', 'Answering questions', 'Advertisers ask “clicks per ad in the last hour”. What serves that?', [
        best('api', 'A query API over the aggregated table, not the raw events', 'Right. Pre-aggregated numbers answer instantly; raw data is for reprocessing.', { add: [n('qapi', 'Query API', 'search', 5.6, 0.5, 'Answers advertiser questions from the aggregated data.')], edges: ['qapi>db'], d: { speed: 10 } }),
        alt('raw', 'Scan raw events for every question', 'wrong', 'Far too slow.'),
        alt('manual', 'Export to a spreadsheet', 'wrong', 'Not near real time.'),
      ], ['Typical queries: clicks per ad per minute, top N ads, filtered by country.'], 'Design GET /ads/{id}/clicks with from, to, interval and filter parameters over a pre-aggregated table.'),
    ],
    window: [
      step('window-types', 'Kinds of time window', 'You count per minute. Which window type is that?', [
        best('tumbling', 'Tumbling: fixed, non-overlapping slices', 'Right. Hopping and sliding windows overlap; tumbling does not.'),
        alt('sliding', 'Sliding', 'wrong', 'Sliding windows overlap.'),
        alt('session', 'Session', 'wrong', 'Session windows depend on activity gaps.'),
      ], ['Hopping slides by a fixed step; sliding emits per event; session ends after inactivity.'], 'Implement tumbling and hopping windows over a stream and compare their outputs.'),
    ],
    exactly: [
      step('hotspot', 'One ad goes viral', 'One ad receives most of the clicks. What happens to its aggregation node?', [
        best('split', 'It is overloaded; spread that ad’s load by adding partitions or splitting the key', 'Right. Hot keys need extra resources or sub-keys that are merged afterwards.'),
        alt('ignore', 'Nothing, nodes are identical', 'wrong', 'The node owning that key is overloaded.'),
        alt('drop', 'Drop some clicks', 'wrong', 'Clicks are revenue.'),
      ], ['Allocate more aggregation nodes for hot partitions.'], 'Split a hot ad key into 8 sub-keys, aggregate separately, then merge counts.'),
      step('recover', 'Recovering a failed node', 'An aggregation node crashes with in-memory counts. How do you recover?', [
        best('snap', 'Restore from a snapshot of state plus the offset, and replay events after it', 'Right. Snapshots limit how much to replay, and offsets say where to resume.'),
        alt('zero', 'Restart from zero', 'wrong', 'Counts would be wrong.'),
        alt('copy', 'Ask another node for its counts', 'ok', 'Possible, but needs replicated state.'),
      ], ['Fault tolerance relies on checkpointing and replayable queues.'], 'Checkpoint window state and the last consumed offset every 30 seconds and restore on restart.'),
    ],
    trust: [
      step('lambda', 'Batch and streaming together', 'Should the batch path and the streaming path be separate systems?', [
        best('choice', 'Either run both in parallel (Lambda) or run one streaming path that can replay history (Kappa)', 'Right. Lambda duplicates logic but keeps a trusted batch; Kappa simplifies by replaying through the stream.'),
        alt('stream', 'Streaming alone is always enough', 'ok', 'Possible with replay, but correctness checks matter.'),
        alt('batch', 'Batch alone', 'ok', 'Too slow for near-real-time reporting.'),
      ], ['Choose based on how much you trust the streaming pipeline.'], 'Compare Lambda and Kappa architectures for ad aggregation in cost, complexity and correctness.'),
    ],
  },

  'object-storage': {
    split: [
      step('buckets', 'Buckets and keys', 'Users store data in buckets under names. What are these?', [
        best('flat', 'A bucket is a container with a globally unique name; an object is stored under a key within it', 'Right. The namespace is flat; slashes in keys are just characters that tools display as folders.'),
        alt('fs', 'A real folder hierarchy', 'wrong', 'There are no real directories.'),
        alt('db', 'A database table per bucket', 'wrong', 'That is an implementation detail at best.'),
      ], ['Objects are immutable: you replace, not edit.'], 'Design the metadata schema: bucket (name, owner), object (bucket, key, object_id, version, size).'),
      step('upload', 'The upload path', 'A client uploads an object. What happens, in order?', [
        best('flow', 'Check access, store the bytes in the data store, then record the metadata', 'Right. Writing metadata last means a record only exists for data that is safely stored.'),
        alt('meta', 'Record metadata first, upload later', 'ok', 'A crash leaves records pointing at nothing.'),
        alt('skip', 'Skip access checks for speed', 'wrong', 'Security is non-negotiable.'),
      ], ['Download is the reverse: look up metadata, then read the bytes by object ID.'], 'Write the PUT object flow: authorize, write bytes with a checksum, then insert metadata.'),
    ],
    durable: [
      step('placement', 'Where do the bytes go?', 'Which machines hold each piece of data?', [
        best('placement', 'A placement service decides, spreading copies across failure domains', 'Right. It knows the topology (racks, zones) and keeps copies apart.', { add: [n('pl', 'Placement service', 'ring', 2.8, 3.8, 'Decides which data nodes store each object, across racks and zones.')], edges: ['api>>pl', 'pl>ds'], d: { availability: 5 } }),
        alt('rand', 'Pick any node', 'ok', 'Copies could land together and fail together.'),
        alt('one', 'Always the same node', 'wrong', 'It fills up and is a single point of failure.'),
      ], ['Heartbeats from data nodes keep the placement service informed.'], 'Choose three nodes for a replica set, one per rack in at least two zones.'),
      step('checksum', 'Silent corruption', 'A bit flips on disk. How do you notice?', [
        best('crc', 'Store a checksum with the data and verify it on read and in background scrubs', 'Right. A mismatch means the copy is bad, and a healthy replica can repair it.'),
        alt('trust', 'Trust the disk', 'wrong', 'Corruption is rare but real at petabyte scale.'),
        alt('user', 'Ask users to check', 'wrong', 'Unreliable.'),
      ], ['Garbage collection also removes corrupted data.'], 'Add a per-object checksum and a background job that verifies a sample of objects daily.'),
    ],
    large: [
      step('versioning', 'Versioning', 'A user overwrites an object by mistake. How can they get the old one back?', [
        best('ver', 'Keep versions: each write adds a new version and the latest is the default', 'Right. Old versions remain until deleted, so mistakes are reversible.'),
        alt('one', 'Overwrite in place', 'wrong', 'The old data is gone.'),
        alt('backup', 'Ask the user to keep backups', 'wrong', 'Defeats the service.'),
      ], ['Deleting adds a delete marker rather than erasing.'], 'Implement object versions with a version ID and a delete marker.'),
      step('list', 'Listing a bucket', 'A bucket holds billions of objects. How does “list objects with this prefix” stay fast?', [
        best('index', 'An index of metadata ordered by key, sharded by bucket and key', 'Right. Ordered keys make prefix scans efficient, and sharding handles size.'),
        alt('scan', 'Scan all objects', 'wrong', 'Too slow.'),
        alt('hash', 'Hash-partition by key only', 'ok', 'Even load, but prefix listing needs scatter-gather.'),
      ], ['Use pagination with continuation tokens.'], 'Design a sharded metadata index supporting prefix listing with pagination tokens.'),
    ],
  },

  leaderboard: {
    design: [
      step('ops', 'The four operations', 'Which commands does a leaderboard need from its store?', [
        best('ops', 'Insert or increment a score, read the top N, read a user’s rank, read neighbours', 'Right. In a sorted set these are ZADD/ZINCRBY, ZREVRANGE, ZREVRANK, and a range around a rank.'),
        alt('sort', 'Sort everything on every read', 'wrong', 'Too slow.'),
        alt('only', 'Only insert', 'wrong', 'Players want to read rankings.'),
      ], ['Each operation is O(log n).'], 'Write helper functions for increment, top N, rank and neighbours using Redis commands.'),
