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
