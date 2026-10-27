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
