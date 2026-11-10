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
