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

export const latency = [
  { name: 'L1 cache reference', ns: 0.5 },
  { name: 'L2 cache reference', ns: 7 },
  { name: 'Main memory reference', ns: 100 },
  { name: 'SSD random read', ns: 150_000 },
  { name: 'Round trip inside a data center', ns: 500_000 },
  { name: 'HDD seek', ns: 10_000_000 },
  { name: 'Round trip between regions', ns: 150_000_000 },
]
export const latencyLessons = [
  'Memory is fast, disk is slow.',
  'Avoid disk seeks when you can.',
  'Compression is cheap: compress before sending over the network.',
  'Crossing regions is expensive; keep chatty calls inside one data center.',
]

export const nines = [
  { label: '99%', name: 'two nines', a: 0.99 },
  { label: '99.9%', name: 'three nines', a: 0.999 },
  { label: '99.99%', name: 'four nines', a: 0.9999 },
  { label: '99.999%', name: 'five nines', a: 0.99999 },
  { label: '99.9999%', name: 'six nines', a: 0.999999 },
]

