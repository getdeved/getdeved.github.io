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
      step('hosted', 'The hosted payment page', 'Why does the customer type their card number on the PSP’s page, not yours?', [
        best('hosted', 'So card data never touches your servers, reducing risk and compliance burden', 'Right. You receive a token or result, not the card number.'),
        alt('pretty', 'Because it looks nicer', 'wrong', 'The reason is security and compliance.'),
        alt('cheap', 'Because it is cheaper to host', 'wrong', 'Security is the main reason.'),
      ], ['The PSP redirects back to you with a result and sends a webhook.'], 'Implement a checkout redirect to a hosted payment page and a return URL handler.'),
      step('states', 'Payment states', 'A payment is created, pending, then succeeds or fails. How do you track it?', [
        best('machine', 'Store the payment order with an explicit status and only allow valid transitions', 'Right. A state machine prevents impossible jumps, like refunding something never paid.'),
        alt('flag', 'A single paid boolean', 'ok', 'Too little for pending, failed and refunded.'),
        alt('none', 'Do not store state', 'wrong', 'You cannot recover from a crash.'),
      ], ['Persist the state after every transition.'], 'Model payment states and transitions in code and reject invalid ones.'),
    ],
    idem: [
      step('delay', 'The PSP is slow', 'The PSP does not answer immediately. What does the customer see?', [
        best('pending', 'A pending status, updated when the PSP’s webhook or a poll reports the result', 'Right. Payments are asynchronous; show progress and reconcile later.'),
        alt('wait', 'A spinner until it answers', 'ok', 'Ties up resources and may time out.'),
        alt('fail', 'Mark it failed', 'wrong', 'It may have succeeded.'),
      ], ['Webhooks plus periodic polling cover missed callbacks.'], 'Handle PSP webhooks idempotently and poll payments stuck in pending for over 5 minutes.'),
    ],
    ledger: [
      step('recon', 'Does it all add up?', 'Every day the PSP sends a settlement file. What do you do with it?', [
        best('recon', 'Compare it line by line with your records and investigate differences', 'Right. Reconciliation catches errors no other check does, and is the last line of defence.', { add: [n('rec', 'Reconciliation', 'shield', 6.1, 3.3, 'Compares your records with the PSP’s settlement file and flags mismatches.')], edges: ['rec>>lg:compare'], d: { availability: 5 } }),
        alt('trust', 'Trust the PSP', 'wrong', 'Mistakes happen on both sides.'),
        alt('skip', 'Skip it, we have logs', 'wrong', 'Logs do not prove balances.'),
      ], ['Some mismatches can be fixed automatically; others need a person.'], 'Write a reconciliation job comparing daily PSP settlement rows with ledger entries and listing mismatches.'),
    ],
    fail: [
      step('security', 'Protecting the system', 'A payment system is a prime target. What basics are essential?', [
        best('sec', 'TLS everywhere, tokenised data, least-privilege access and audit logs', 'Right. Layered protection limits damage if one layer fails.'),
        alt('one', 'A strong firewall is enough', 'wrong', 'No single control is enough.'),
        alt('none', 'Hide the URLs', 'wrong', 'Not security.'),
      ], ['Also protect against replay and verify webhook signatures.'], 'Verify PSP webhook signatures and reject replays using a timestamp window.'),
      step('comm', 'Services talking to each other', 'Payment, order and ledger services must stay consistent. How do they communicate?', [
        best('async', 'Asynchronous messages with idempotent handlers, plus synchronous calls where an answer is needed', 'Right. Queues add resilience; idempotency makes retries safe.'),
        alt('sync', 'Only synchronous calls', 'ok', 'Simple, but one slow service stalls the rest.'),
        alt('shared', 'A shared database', 'wrong', 'Tight coupling and hard to evolve.'),
      ], ['Use exactly-once semantics at the effect level, not the transport level.'], 'Publish payment-succeeded events and have order and ledger services consume them idempotently.'),
    ],
  },

  wallet: {
    shard: [
      step('inmem', 'Balances in memory', 'A database round trip per transfer is too slow for a million per second. What do you do?', [
        best('mem', 'Keep balances in memory on the node that owns them, backed by a durable log', 'Right. Memory is fast; the log makes it recoverable.'),
        alt('db', 'Read and write the database each time', 'wrong', 'Too slow.'),
        alt('cache', 'A best-effort cache', 'wrong', 'A lost balance is unacceptable.'),
      ], ['In-memory key-value stores such as Redis offer speed but need durability design.'], 'Hold account balances in a per-node map and append every change to a write-ahead log.'),
    ],
    dist: [
      step('saga', 'Saga for transfers', 'TC/C and sagas both cope with cross-node transfers. How does a saga differ?', [
        best('saga', 'A saga runs local steps in order and undoes completed ones with compensations if a step fails', 'Right. It is simpler than TC/C but intermediate states are visible between steps.'),
        alt('same', 'It is identical to TC/C', 'wrong', 'TC/C reserves first, then confirms or cancels everywhere.'),
        alt('lock', 'It locks every account first', 'wrong', 'That is closer to two-phase commit.'),
      ], ['Choreography: services react to events. Orchestration: a coordinator drives the steps.'], 'Compare choreography and orchestration sagas for a wallet transfer.'),
      step('crash', 'The coordinator crashes', 'The coordinator dies after Try but before Confirm. What now?', [
        best('log', 'On restart, read its durable log and finish or cancel each in-flight transfer', 'Right. Persisted state turns a crash into a pause.'),
        alt('forget', 'Forget the transfer', 'wrong', 'Funds stay reserved forever.'),
        alt('retry', 'Run the transfer again from the start', 'ok', 'Needs idempotency, or it may double move money.'),
      ], ['Out-of-order Try and Cancel messages must be handled gracefully.'], 'Write recovery that replays a transaction log and completes or cancels each unfinished TC/C transfer.'),
    ],
    es: [
      step('cmd', 'Commands and events', 'In event sourcing, what is the difference between a command and an event?', [
        best('def', 'A command is a request that may be rejected; an event is a fact that already happened', 'Right. Validation turns a command into zero or more events, which are never changed.'),
        alt('same', 'They are the same', 'wrong', 'Commands can fail; events cannot be undone.'),
        alt('rev', 'Events are requests', 'wrong', 'Reversed.'),
      ], ['Example: Transfer is a command; TransferCompleted is an event.'], 'Validate a Transfer command against balances and emit TransferCompleted or TransferRejected events.'),
      step('snap', 'Snapshots', 'Replaying years of events on restart is slow. What helps?', [
        best('snap', 'Periodic snapshots of state, replaying only events after the latest one', 'Right. Recovery loads a snapshot then applies a short tail of events.', { add: [n('snap', 'Snapshots', 'archive', 4.6, 5, 'Periodic copies of state so recovery replays only recent events.')], edges: ['el>>snap'], d: { speed: 5 } }),
        alt('all', 'Always replay everything', 'ok', 'Correct but slow.'),
        alt('drop', 'Delete old events', 'wrong', 'Loses the audit trail.'),
      ], ['Snapshots are an optimisation; the log remains the truth.'], 'Take a snapshot every 100,000 events and make recovery load the latest snapshot then replay the rest.'),
    ],
    ha: [
      step('verify', 'Can we prove the balances?', 'Auditors want proof that balances are correct. What gives it to you?', [
        best('replay', 'Replay the event log independently and compare with the live state', 'Right. Deterministic replay is a built-in audit tool.'),
        alt('trust', 'Trust the live state', 'wrong', 'Bugs would go unnoticed.'),
        alt('spot', 'Spot-check a few accounts', 'ok', 'Catches some errors only.'),
      ], ['Reproducibility is the main benefit of event sourcing.'], 'Write a verifier that replays the log into a fresh state and diffs it against production balances.'),
    ],
  },

  exchange: {
    book: [
      step('orders', 'Limit and market orders', 'What is the difference between a limit order and a market order?', [
        best('def', 'A limit order sets a price; a market order takes the best available price now', 'Right. Limit orders can rest in the book; market orders execute immediately against it.'),
        alt('same', 'No difference', 'wrong', 'One fixes the price, the other fixes the timing.'),
        alt('rev', 'Market orders set a price', 'wrong', 'Reversed.'),
      ], ['Many other order types build on these two.'], 'Implement market and limit order handling in a matching engine, including partial fills.'),
      step('feed', 'Telling the world prices', 'Traders want live prices and the book’s depth. How does the exchange share it?', [
        best('pub', 'A market data publisher builds price levels from executions and streams them to subscribers', 'Right. It is separate from matching, so a slow subscriber never slows trading.', { add: [n('md', 'Market data publisher', 'radio', 5.2, 0.5, 'Turns executions into live price data (L1, L2, L3) and distributes it to subscribers.')], edges: ['me>>md:executions'], d: { speed: 5 } }),
        alt('poll', 'Everyone polls the engine', 'wrong', 'Floods the most latency-sensitive component.'),
        alt('email', 'Email prices', 'wrong', 'Far too slow.'),
      ], ['Levels: L1 best bid and ask; L2 depth by price; L3 each order.'], 'Publish top-of-book and depth updates from an order book to subscribers over a stream.'),
    ],
    seq: [
      step('bus', 'Fast messaging inside the engine', 'Components must pass events in microseconds. How?', [
        best('mmap', 'A shared memory-mapped ring buffer on one machine, with no network or serialisation overhead', 'Right. Avoiding copies and locks gets latency down to microseconds.'),
        alt('http', 'HTTP between components', 'wrong', 'Milliseconds, not microseconds.'),
        alt('queue', 'A heavyweight message broker', 'ok', 'Fine for slower flows, too slow here.'),
      ], ['Colocating components on one server removes network hops.'], 'Implement a single-producer ring buffer in shared memory for passing events between two threads.'),
    ],
    es: [
      step('thread', 'One thread, one core', 'Locks slow things down. How does the matching engine avoid them?', [
        best('single', 'A single-threaded main loop pinned to one CPU core, processing events in order', 'Right. No locks and no context switches, and the order is naturally deterministic.'),
        alt('many', 'Many threads on the same book', 'wrong', 'Locking and non-determinism.'),
        alt('async', 'Asynchronous callbacks everywhere', 'ok', 'Adds overhead and complexity.'),
      ], ['Shard by symbol to use more cores: each symbol’s book has its own single-threaded engine.'], 'Run one matching engine thread per symbol shard with events delivered by a lock-free queue.'),
    ],
    ha: [
      step('fair', 'Fair distribution of prices', 'Everyone should see a price at about the same moment. How is that approached?', [
        best('multi', 'Multicast distribution over a reliable network so every subscriber receives each message at the same time', 'Right. One send reaches many receivers simultaneously, which is fairer than looping through connections.'),
        alt('loop', 'Send to each subscriber in turn', 'wrong', 'Earlier subscribers get an advantage.'),
        alt('slow', 'Delay everyone equally', 'ok', 'Fair but costly.'),
      ], ['Colocation: brokers rent space near the exchange; equal-length cables keep latency fair.'], 'Describe multicast market data distribution and why equal cable lengths matter for fairness.'),
    ],
  },
}
