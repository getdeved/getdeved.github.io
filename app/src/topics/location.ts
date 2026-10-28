import type { Topic } from '../types'
import { alt, best, n, step, topic } from './dsl'

export const proximity: Topic = topic('proximity', 'Design a proximity service',
  '“Restaurants within 2 km of me”: find nearby places among hundreds of millions, in milliseconds.',
  [
    step('split', 'Two very different workloads',
      'Users search nearby businesses thousands of times a second; owners edit their listing now and then. How do you structure the services?',
      [
        best('split', 'A location-based service for searches and a business service for listings, behind a load balancer', 'Right. Searches are read-heavy, stateless and need to scale out; listing updates are rare. Separating them lets each scale to its own load.',
          { add: [n('u', 'Users', 'phone', 0, 2, 'Search for nearby businesses from their phones.'), n('lb', 'Load balancer', 'lb', 1.6, 2, 'Routes search and business requests to the right service.'), n('lbs', 'Location service', 'pin', 3.3, 0.8, 'Read-heavy, stateless service that answers “what is near this point?”.'), n('bs', 'Business service', 'server', 3.3, 3.2, 'Handles adding, editing and fetching business details.'), n('db', 'Database cluster', 'db', 5.2, 2, 'Primary for writes with read replicas for searches.')],
            edges: ['u>lb', 'lb>lbs:search', 'lb>bs:details', 'lbs>db', 'bs>db'], d: { capacity: 20, availability: 10, complexity: 10 } }),
        alt('one', 'One service for everything', 'ok', 'Simpler, but search load and business edits must then scale together.'),
        alt('gps', 'Each client computes distances itself', 'wrong', 'The client does not have the data.'),
      ],
      ['Search API: GET /search/nearby?latitude=&longitude=&radius=. Updates are not real-time: they can take effect the next day.'],
      'Design the nearby-search and business-update APIs, including pagination and the radius parameter.'),
    step('naive', 'The obvious query is slow',
      'You store latitude and longitude as columns and run: WHERE lat BETWEEN … AND lon BETWEEN …. With 200 million rows it crawls. Why?',
      [
        best('index', 'Two one-dimensional indexes cannot efficiently answer a two-dimensional query', 'Right. Each index narrows one axis, and the database must intersect two huge result sets. You need an index built for 2D space.',
          { d: { speed: 5 } }),
        alt('hw', 'The database just needs more RAM', 'wrong', 'The query shape is the problem, not the memory.'),
        alt('join', 'Latitude and longitude need to be joined', 'wrong', 'They are columns in the same row; there is nothing to join.'),
      ],
      ['Fix: map 2D space to something indexable, using grids, geohash, quadtrees or S2.'],
      'Show a SQL query that finds businesses in a bounding box and explain with EXPLAIN why indexes on lat and lon separately do not help.'),
    step('geohash', 'Geohash: space as a string',
      'You decide to index space with geohash, which turns coordinates into a short string where nearby places share a prefix. How do you search?',
      [
        best('gh', 'Find the user’s geohash cell at the right precision, plus its eight neighbours, and filter by true distance', 'Right. The cell and its neighbours cover the boundary problem (two close places can have different prefixes), and a final distance check removes the extras. Precision is chosen from the radius: a longer prefix means a smaller cell.',
          { add: [n('gh', 'Geohash index', 'hash', 5.2, 4.2, 'Index mapping a geohash string to the businesses inside that cell.')], edges: ['lbs>gh:cell + neighbours'], d: { speed: 25, capacity: 20, complexity: 10 } }),
        alt('one', 'Only search the single matching cell', 'wrong', 'Misses places just across a cell boundary that are actually very close.'),
        alt('all', 'Always use the shortest geohash prefix', 'wrong', 'The cell would be huge and return far too many results.'),
      ],
      ['Alternatives: a quadtree (adaptive to density, held in memory), Google S2 (Hilbert-curve cells), or a fixed grid (uneven in dense cities).', 'Geohash is simple, and updates are easy because a business belongs to one cell.'],
      'Implement geohash encode, decode and neighbours, and a nearby search that queries the cell plus neighbours then filters by distance.'),
    step('scale', 'Scale and low latency',
      'A busy city at lunchtime hammers the same cells. How do you keep it quick and available?',
      [
        best('cache', 'Cache geohash lookups and business details, replicate the database, and shard by region only if needed', 'Right. Business data changes rarely so caching works well. Replicas absorb reads and add redundancy; the dataset is not huge enough to require sharding early.',
          { add: [n('c', 'Cache', 'cache', 4.3, 4.6, 'Holds geohash → business ID lists and business details.')], edges: ['lbs>c', 'bs>c'], d: { speed: 20, availability: 15, capacity: 10, complexity: 5 } }),
        alt('shard', 'Shard everything by location immediately', 'premature', 'The data is only a few GB; replication gives you what you need first.'),
        alt('none', 'Do nothing; it is read-only anyway', 'wrong', 'Peak-hour spikes in dense areas still overload single nodes.'),
      ],
      ['Data privacy: honour GDPR/CCPA rules around location and user data.'],
      'Add Redis caching for geohash-to-business-ID lists and business detail objects, and a plan for invalidating on business updates.'),
  ],
  ['Separate search and listing workloads.', 'Spatial indexes beat two 1D indexes.', 'Geohash plus neighbours handles boundaries.', 'Cache and replicate for peaks.'])

export const nearbyFriends: Topic = topic('nearby-friends', 'Design nearby friends',
  'Show which friends are within a few kilometres, updated live, for tens of millions of people.',
  [
