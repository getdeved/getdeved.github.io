// Content for "Back-of-the-envelope estimation". Numbers follow the course notes; wording and
// the second worked problem are our own.

export type Q = {
  id: string
  label: string // ledger row name
  ask: string
  unit: string // the unit the answer is entered in
  answer: number
  tol: number // accepted relative error; estimation is about the order of magnitude, not precision
  how: string // the working, shown after answering
  hint: string
}
export type Problem = { id: string; title: string; scenario: string; assumptions: string[]; steps: Q[] }

export const estimationIntro =
  'Before you design anything, you need to know how big it is. Learn the numbers every engineer carries around, then practise turning vague requirements into traffic, storage and bandwidth.'

export const tips = [
  { title: 'Round hard', body: 'Nobody needs 99,987 ÷ 9.1. Use 100,000 ÷ 10. The process matters more than the third digit.' },
  { title: 'Write down assumptions', body: 'Every estimate stands on guesses. Put them on the page so they can be challenged and changed.' },
  { title: 'Label units', body: 'Is that 5 KB or 5 MB? A bare "5" hides a factor of a thousand.' },
  { title: 'Estimate the usual suspects', body: 'Queries per second, peak QPS, storage, cache size, bandwidth, number of servers.' },
]

export const powers = [
  { exp: 10, approx: '1 thousand', unit: 'KB' },
  { exp: 20, approx: '1 million', unit: 'MB' },
  { exp: 30, approx: '1 billion', unit: 'GB' },
  { exp: 40, approx: '1 trillion', unit: 'TB' },
  { exp: 50, approx: '1 quadrillion', unit: 'PB' },
]

