import { alt, best, n, step } from './dsl'
import type { Extras } from './extras1'

export const extras4: Extras = {
  hotel: {
    model: [
      step('states', 'A reservation has a life', 'A booking is created, paid, and sometimes cancelled. How do you record that?', [
        best('status', 'A status field moving through defined states, such as pending, paid, confirmed, cancelled', 'Right. Explicit states make retries, payments and refunds easier to reason about.'),
        alt('delete', 'Delete the row on cancellation', 'wrong', 'You lose history and cannot refund correctly.'),
        alt('free', 'A free-text note', 'wrong', 'Not queryable or reliable.'),
      ], ['Reservation rows hold the guest, dates, status and idempotency key.'], 'Add a status enum and allowed transitions to the reservation table.'),
      step('apis', 'The booking API', 'Guests book rooms. What does the request carry?', [
        best('req', 'Hotel, room type, dates, guest and a unique reservation ID from the client', 'Right. The client-generated ID makes the call idempotent: a retry does not book twice.'),
        alt('room', 'Only a room number', 'wrong', 'Guests book types and dates, not rooms.'),
        alt('none', 'No ID, the server decides', 'ok', 'Fine until someone double-clicks.'),
      ], ['POST /v1/reservations with an idempotency key.'], 'Design POST /v1/reservations with a client-generated reservation ID and idempotent behaviour.'),
    ],
    race: [
      step('overbook', 'Selling more than you have', 'Hotels sometimes accept more bookings than rooms, such as 10% over. Why?', [
        best('cancel', 'Because some guests cancel, so unsold rooms are the bigger cost', 'Right. Overbooking is a business choice, handled by allowing reserved to exceed inventory up to a limit.'),
        alt('bug', 'It is always a bug', 'wrong', 'It can be deliberate policy.'),
        alt('never', 'Never allowed anywhere', 'wrong', 'Many hotels and airlines do it.'),
      ], ['Make the overbooking limit configurable per hotel.'], 'Allow reservations up to total_inventory * 1.1 per room type per date, configurable.'),
      step('idem', 'Double clicks', 'A guest double-clicks Book. What stops two reservations?', [
        best('key', 'A unique reservation ID on the table: the second insert is rejected as a duplicate', 'Right. A unique constraint is a cheap, reliable guard.'),
        alt('ui', 'Disable the button only', 'ok', 'Helps, but retries and replays still happen.'),
        alt('none', 'Nothing', 'wrong', 'Two bookings, two charges.'),
      ], ['Return the existing reservation for a repeated ID.'], 'Add a unique constraint on reservation_id and return the original on a duplicate.'),
    ],
    scale: [
      step('services', 'Splitting into services', 'Hotel info, prices, reservations and payments change at different rates. How do you divide them?', [
        best('services', 'Separate services: hotel, rate, reservation, payment', 'Right. Each has its own data and scaling; hotel details change rarely, rates are looked up often, reservations are the critical path.', { add: [n('hs', 'Hotel service', 'dc', 2.9, 3.6, 'Provides hotel and room details, which rarely change.'), n('rate', 'Rate service', 'trend', 1.4, 3.8, 'Provides room prices by date. Prices vary with demand.')], edges: ['gw>hs', 'gw>rate'], d: { capacity: 10, complexity: 10 } }),
        alt('mono', 'One service for everything', 'ok', 'Simple, but everything scales together.'),
        alt('db', 'One shared table for all', 'wrong', 'Unrelated data forced together.'),
      ], ['Static hotel data and images suit a CDN.'], 'Define the boundaries and APIs between hotel, rate, reservation and payment services.'),
    ],
    microservices: [
      step('refund', 'Cancellations and refunds', 'A guest cancels. What must happen?', [
        best('comp', 'Release the inventory and refund the payment, as a compensating flow', 'Right. Reversal is its own set of steps, run safely and idempotently.'),
        alt('delete', 'Delete the reservation only', 'wrong', 'The money and the room stay in limbo.'),
        alt('manual', 'Handle every cancellation by hand', 'ok', 'Not at scale.'),
      ], ['Admin tools may issue refunds through an internal API behind a VPN.'], 'Implement cancellation as a saga: mark cancelled, release inventory, refund payment, with retries.'),
    ],
  },

  email: {
    flow: [
      step('protocols', 'Email protocols', 'Which protocol sends email between servers, and which fetches it?', [
        best('smtp', 'SMTP sends between servers; IMAP or POP fetch mail to a client', 'Right. IMAP keeps mail on the server across devices; POP downloads it. Webmail uses HTTPS instead.'),
        alt('http', 'HTTP does both', 'wrong', 'Webmail uses it, but servers talk SMTP.'),
        alt('ftp', 'FTP', 'wrong', 'Not an email protocol.'),
      ], ['Large modern services also expose proprietary APIs.'], 'Walk an email from sender to recipient listing each protocol and server involved.'),
      step('sending', 'Sending is asynchronous', 'A user presses Send. Should the web server talk to the recipient’s mail server inline?', [
        best('queue', 'No: queue the message and let outgoing workers deliver and retry', 'Right. Remote servers can be slow or down, so queueing decouples the user from delivery.', { add: [n('oq', 'Outgoing queue', 'queue', 3.5, 4.9, 'Holds messages waiting to be delivered by SMTP workers, with retries.')], edges: ['ws>oq'], d: { availability: 10 } }),
        alt('inline', 'Yes, inline', 'wrong', 'The user waits and failures are lost.'),
        alt('skip', 'Send directly from the browser', 'wrong', 'Not possible or safe.'),
      ], ['Retry with backoff for temporary failures; bounce for permanent ones.'], 'Queue outgoing emails and write a worker that retries temporary SMTP failures with exponential backoff.'),
    ],
    meta: [
      step('inbound', 'Receiving mail', 'Mail arrives from other providers. What handles it?', [
        best('inbound', 'Inbound SMTP servers that check for spam and viruses, then store the message', 'Right. Filtering before storage keeps your inboxes clean.', { add: [n('inb', 'Inbound SMTP', 'mail', 5.4, 2, 'Accepts mail from other providers and filters spam and viruses before storing.')], edges: ['inb>md'], d: { availability: 5 } }),
        alt('web', 'The web servers accept it', 'wrong', 'They are not mail servers and not safe to expose that way.'),
        alt('none', 'Accept everything unfiltered', 'wrong', 'Spam floods every inbox.'),
      ], ['Reject mail that fails authentication checks where policy allows.'], 'Add an inbound SMTP stage that runs spam and virus scanning before writing to the mailbox store.'),
    ],
    deliver: [
      step('bounce', 'Bounces and complaints', 'Some mail bounces; some recipients mark it as spam. Why does that matter?', [
        best('rep', 'They damage your sending reputation, so feed them back and stop sending to bad addresses', 'Right. Providers watch bounce and complaint rates. Handle them quickly to stay trusted.'),
        alt('ignore', 'It does not matter', 'wrong', 'High rates push all your mail to spam.'),
        alt('retry', 'Keep retrying forever', 'wrong', 'That worsens the problem.'),
      ], ['Set up feedback loops with major ISPs.'], 'Process bounce notifications by suppressing hard-bounced addresses and tracking complaint rate per sender.'),
    ],
    search: [
      step('cache', 'Recent mail fast', 'Users mostly read recent mail. How do you speed that up?', [
        best('cache', 'Cache recent messages and folder listings', 'Right. The hot slice of each mailbox fits in memory.', { add: [n('cc', 'Mail cache', 'cache', 5.4, 3.6, 'Holds each user’s recent emails for instant opening.')], edges: ['ws>>cc'], d: { speed: 10 } }),
        alt('db', 'Always read from the database', 'ok', 'Correct but slower under load.'),
        alt('all', 'Cache all mail', 'wrong', 'Memory cannot hold petabytes.'),
      ], ['Replicate across data centers for availability.'], 'Add an LRU cache for each user’s latest 100 emails with invalidation on new mail.'),
    ],
  },

  payments: {
    flow: [
