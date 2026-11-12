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
