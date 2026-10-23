import type { Topic } from '../types'
import { alt, best, n, step, topic } from './dsl'

export const urlShortener: Topic = topic('url-shortener', 'Design a URL shortener',
  'Turn long links into short ones and redirect them back, for hundreds of millions of links.',
  [
    step('redirect', 'A short link is opened',
      'A browser requests short.ly/zn9edcu. The server knows the long URL. What does it return?',
      [
        best('302', 'An HTTP redirect to the long URL (302 if you want click analytics)', 'Right. The server answers with a redirect and a Location header. 301 means “moved permanently” so browsers cache it and later clicks skip your server; 302 is temporary, so every click reaches you and can be counted.',
          { add: [n('u', 'User', 'users', 0, 2, 'Someone clicking a short link.'), n('web', 'Shortener service', 'server', 2.5, 2, 'Looks up the short code and replies with a redirect to the long URL.'), n('db', 'URL table', 'db', 5, 2, 'Stores shortURL → longURL pairs.')],
            edges: ['u>web:GET /zn9edcu', 'web>db:lookup', 'web>>u:302 + Location'], d: { capacity: 10, speed: 10 } }),
        alt('copy', 'Fetch the long page and serve it from the shortener', 'wrong', 'You would proxy every site on earth. A redirect is cheap; proxying is not.'),
        alt('js', 'Return a page with JavaScript that navigates', 'ok', 'Works, but slower, and breaks for clients that do not run scripts.'),
      ],
      ['301 saves server load; 302 gives analytics. Choose by whether you need click data.'],
      'Implement GET /:code that looks up a long URL and returns a 302 redirect, with a 404 for unknown codes.'),
    step('hash', 'Making the short code',
      'You expect about 365 billion URLs over ten years. The code should use only 0-9, a-z, A-Z. How do you generate it?',
      [
        best('b62', 'Give each URL a unique numeric ID, then convert it to base 62', 'Right. 62^7 is about 3.5 trillion, so seven characters are enough. A unique ID guarantees no collisions, and the code is short and predictable.',
          { add: [n('id', 'ID generator', 'ticket', 2.5, 4, 'Hands out globally unique numeric IDs. The ID is then converted into a base-62 string.')], edges: ['web>id:next ID'], d: { capacity: 15, complexity: 10 } }),
        alt('hash', 'Hash the URL (CRC32 or MD5) and keep the first 7 characters, retrying on collision', 'ok', 'Needs no ID generator and is unguessable, but collisions require a database check on every write.'),
        alt('rand', 'Pick a random 7-character string', 'wrong', 'Collisions grow with scale and every candidate needs a lookup.'),
      ],
      ['Base 62 needs a unique ID generator across servers (see the Unique ID topic). It is the main weakness: IDs can be guessable.', 'Hash + collision: re-hash with a salt until unused; a Bloom filter speeds up the check.'],
      'Write base-62 encode and decode functions and use them to turn an auto-incrementing ID into a short code.'),
    step('cache', 'Reads dwarf writes',
      'Writes are about 100 million per day, but reads are roughly ten times that. The database is feeling it. What do you add?',
      [
        best('cache', 'A cache in front of the URL table', 'Right. Redirects are read-heavy and the mapping rarely changes. Hot links come from memory, and the database is left for misses and writes.',
          { add: [n('c', 'Cache', 'cache', 3.8, 0.5, 'Stores recently used shortURL → longURL pairs in memory.')], edges: ['web>c'], d: { speed: 15, capacity: 15, complexity: 5 } }),
        alt('shard', 'Shard the URL table immediately', 'premature', 'The first lever for a read-heavy workload is caching. Sharding adds complexity you may not need yet.'),
        alt('bigger', 'Make the redirect service bigger', 'wrong', 'The service is not the bottleneck; database reads are.'),
      ],
      ['Also: stateless web tier behind a load balancer, replicated and sharded database, and a rate limiter to stop abuse.'],
      'Add a Redis read-through cache to my redirect handler with a 24h TTL, and make cache misses fall back to the database.'),
    step('analytics', 'What is the next problem?',
      'Marketing wants click counts per link, and some people are spamming link creation. What do you add?',
      [
        best('limit', 'A rate limiter on creation, and analytics events sent to a queue', 'Right. Throttling stops abuse, and counting clicks asynchronously keeps redirects fast while analytics are built elsewhere.',
          { add: [n('rl', 'Rate limiter', 'gauge', 1.2, 0.5, 'Caps how many links one client can create.'), n('q', 'Click events', 'queue', 5.5, 0.5, 'Queue of click events processed later for analytics.')], edges: ['u>rl', 'web>q:click'], d: { availability: 10, complexity: 10 } }),
        alt('sync', 'Write a counter to the database on every redirect', 'wrong', 'Turns every read into a write and slows the hot path.'),
        alt('ignore', 'Skip both for now', 'ok', 'Fine for a prototype, but both are standard at this scale.'),
      ],
      ['Availability: replicate the database, keep the web tier stateless, monitor it.'],
      'Send a click event to a queue on every redirect without slowing the response, and write a worker that aggregates counts per link per hour.'),
  ],
  ['Redirects are 301 or 302; 302 lets you count.', 'Unique ID plus base 62 avoids collisions.', 'Cache the read path.', 'Rate-limit creation and push analytics off to a queue.'])

export const webCrawler: Topic = topic('web-crawler', 'Design a web crawler',
  'Fetch a billion pages politely, without loops, duplicates or hammering any one website.',
  [
    step('frontier', 'Where do URLs wait?',
      'The crawler discovers links faster than it can download them. You start from a few seed URLs. How do you hold and order the work?',
      [
        best('frontier', 'A URL frontier: a queue of URLs to download', 'Right. The frontier stores pending URLs, hands them to downloaders, and is the natural place to add priority and politeness rules.',
          { add: [n('seed', 'Seed URLs', 'doc', 0, 2, 'Starting points of the crawl, such as popular sites.'), n('fr', 'URL frontier', 'queue', 1.8, 2, 'Queue of URLs waiting to be downloaded.'), n('dl', 'HTML downloader', 'crawler', 3.6, 2, 'Fetches pages from the URLs it is given.'), n('dns', 'DNS resolver', 'dns', 3.6, 0.5, 'Turns host names into IP addresses for the downloader.')],
            edges: ['seed>fr', 'fr>dl', 'dl>dns'], d: { capacity: 15, complexity: 10 } }),
        alt('dfs', 'A recursive depth-first crawl from each seed', 'wrong', 'The web is huge and deeply linked, so depth is unpredictable and can go very deep.'),
        alt('list', 'A plain in-memory list of URLs', 'ok', 'Works for a toy crawler, but it ignores politeness, priority and crash recovery.'),
      ],
      ['BFS with a FIFO queue is the common approach; plain BFS ignores priority and politeness, which is why the frontier does more.'],
      'Design a URL frontier as a queue with enqueue and dequeue, persisting to disk so a crash does not lose pending URLs.'),
