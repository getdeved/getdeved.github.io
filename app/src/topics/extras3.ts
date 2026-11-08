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
