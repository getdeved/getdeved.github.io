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
