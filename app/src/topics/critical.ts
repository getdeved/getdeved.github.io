import type { Topic } from '../types'
import { alt, best, n, step, topic } from './dsl'

export const hotel: Topic = topic('hotel', 'Design a hotel reservation system',
  'Sell rooms for future dates without ever booking the same last room twice.',
  [
    step('model', 'What do you actually reserve?',
      'A guest books “a deluxe room, 3 nights”. Do you reserve one specific room, or something else?',
      [
        best('type', 'A room type for a date range, tracked by per-night inventory counts', 'Right. Guests book a kind of room, and the hotel assigns the physical room later. A row per (hotel, room type, date) with total inventory and total reserved makes availability a simple lookup.',
          { add: [n('u', 'Guests', 'users', 0, 2, 'Book rooms on a phone or computer.'), n('gw', 'API gateway', 'lb', 1.4, 2, 'Authentication and rate limiting for public APIs.'), n('rs', 'Reservation service', 'ticket', 2.9, 2, 'Takes reservation requests and tracks room inventory.'), n('db', 'Reservation DB', 'db', 4.6, 2, 'Relational database: reservation and room_type_inventory tables.')], edges: ['u>gw', 'gw>rs', 'rs>db'], d: { capacity: 15, complexity: 10 } }),
        alt('room', 'Reserve a specific physical room number at booking time', 'ok', 'Possible, but it forces guests to choose a room and complicates changes. Most hotels assign at check-in.'),
        alt('free', 'Store free-form text and decide later', 'wrong', 'You cannot count availability from unstructured data.'),
      ],
      ['Relational databases fit well: strong ACID guarantees, and the read volume is modest (about 3 reservations per second here).'],
      'Design the room_type_inventory table (hotel_id, room_type_id, date, total_inventory, total_reserved) and the query that checks availability for a date range.'),
    step('race', 'The last room',
      'Two guests click “Book” for the last room at the same instant. Both read “1 available”. How do you prevent a double booking?',
      [
        best('lock', 'Use database transactions with a lock or constraint on inventory', 'Right. A check constraint (reserved ≤ inventory) or pessimistic/optimistic locking makes the check-and-increment atomic, so only one booking wins. Relational databases give you this for free.',
          { d: { availability: 10, complexity: 10 } }),
        alt('check', 'Check availability in application code, then write', 'wrong', 'The classic race: both checks pass before either write happens.'),
        alt('queue', 'Serialise all reservations through one global queue', 'ok', 'Correct but a bottleneck: hotel A and hotel B do not need to wait for each other.'),
      ],
      ['Also: idempotency keys, so a double-clicked “Book” creates one reservation, not two.', 'Some hotels allow overbooking by a few percent because of cancellations.'],
      'Make a reservation endpoint that checks and updates inventory in one transaction, with an idempotency key to prevent duplicates.'),
    step('scale', 'Peak traffic and scale',
      'A big sale sends traffic up. How do you scale the read path without risking the integrity of the write path?',
      [
        best('cache', 'Cache inventory reads and shard by hotel, but keep the database as the source of truth', 'Right. Reads go through a cache (the database still arbitrates the booking), and data can be sharded by hotel_id since bookings rarely span hotels. Static hotel data goes through a CDN.',
          { add: [n('c', 'Inventory cache', 'cache', 4.6, 0.5, 'Fast read copy of availability. The database remains authoritative.'), n('cdn', 'CDN', 'cdn', 1.4, 0.4, 'Serves hotel images and static pages.')], edges: ['rs>c', 'u>>cdn:static'], d: { speed: 20, capacity: 20, complexity: 10 } }),
        alt('nodb', 'Move reservations to a cache only', 'wrong', 'You would lose durability and the transactional guarantees.'),
        alt('none', 'Add nothing; bookings are low volume', 'ok', 'Reasonable for normal traffic, but peaks need a plan.'),
      ],
      ['Hotel, rate and payment are separate services, each with its own storage.'],
      'Shard the reservation tables by hotel_id and show how the application picks the shard.'),
    step('microservices', 'Several services must agree',
      'Booking a room reserves inventory in one service and charges a card in another. If the payment fails, the reserved room must be released. How do you keep them consistent?',
      [
        best('saga', 'A saga: a chain of local transactions with compensating actions on failure', 'Right. Each step commits locally; if a later step fails, earlier steps are undone by compensation (release the room). It avoids locking across services. Two-phase commit is the stricter alternative, with heavy coordination costs.',
          { add: [n('pay', 'Payment service', 'card', 5.9, 3.7, 'Charges the guest and updates the reservation status.')], edges: ['rs>pay:charge', 'pay>>rs:paid / failed'], d: { availability: 15, complexity: 20 } }),
        alt('2pc', 'Two-phase commit across services', 'ok', 'Strong atomicity, but blocking and fragile if the coordinator dies, and uncommon across independent services.'),
        alt('hope', 'Charge first, fix mismatches by hand', 'wrong', 'Customers get charged without rooms.'),
      ],
      ['Alternatively, merge related tables into one database so a normal transaction suffices.'],
      'Implement a booking saga: reserve inventory, charge payment, and on failure run a compensating release, with a persisted state machine.'),
  ],
  ['Reserve room types per date.', 'Make check-and-update atomic.', 'Cache reads; keep the database authoritative.', 'Use sagas or merge data across services.'])

export const email: Topic = topic('email', 'Design a distributed email service',
  'Receive, store, search and deliver email for a billion people, and keep it out of the spam folder.',
  [
    step('flow', 'From a traditional mail server to a distributed one',
      'A classic mail server stores mailboxes on its own disk, so it hits capacity quickly. How do you rebuild it to scale?',
      [
        best('dist', 'Web and real-time servers in front, with metadata, attachments and search in separate, scalable stores', 'Right. Web servers handle login and mail actions, a real-time channel pushes new mail, and each kind of data goes where it fits: metadata in a database, large attachments in an object store, full-text in a search store.',
          { add: [n('u', 'Webmail clients', 'users', 0, 2, 'Browsers and apps reading and sending mail.'), n('ws', 'Web servers', 'server', 1.6, 2, 'Login, sending, listing mail.'), n('rt', 'Real-time servers', 'wifi', 1.6, 0.4, 'Push new-mail events with WebSockets.'), n('md', 'Metadata DB', 'db', 3.5, 2, 'Subject, sender, recipients, flags and body text.'), n('at', 'Attachment store', 'boxes', 3.5, 3.6, 'Object storage for large attachments.'), n('se', 'Search store', 'search', 3.5, 0.4, 'Document store supporting full-text search.')],
            edges: ['u>ws', 'rt>>u:new mail', 'ws>md', 'ws>at', 'ws>se'], d: { capacity: 25, speed: 10, complexity: 15 } }),
        alt('big', 'Buy a bigger mail server', 'wrong', 'A billion users will not fit on any one box.'),
        alt('db', 'Put everything, attachments included, in one relational database', 'wrong', 'Huge blobs and full-text search overwhelm it.'),
      ],
      ['Email protocols: SMTP sends between servers; POP and IMAP fetch mail to clients; webmail uses HTTPS.', 'Scale numbers: about 10,000 sent emails per second at this size, and petabytes a year.'],
      'Sketch the architecture for sending an email: web server, outgoing queue, SMTP workers, and the recipient’s inbound pipeline.'),
