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

export const problems: Problem[] = [
  {
    id: 'microblog',
    title: 'A microblogging app',
    scenario: 'You are asked to size a short-post social app: how much traffic must it take, and how much media will it have to store?',
    assumptions: [
      '300 million monthly active users',
      '50% of them use the app every day',
      'Each daily user posts 2 posts per day',
      '10% of posts include media, 1 MB each',
      'Peak traffic is 2× the average',
      'Media is kept for 5 years',
    ],
    steps: [
      { id: 'dau', label: 'Daily active users', ask: 'How many people use the app on a typical day?', unit: 'users', answer: 150e6, tol: 0.02,
        how: '300 million × 50% = 150 million', hint: 'Half of the monthly users show up each day.' },
      { id: 'posts', label: 'Posts per day', ask: 'How many posts are created per day?', unit: 'posts/day', answer: 300e6, tol: 0.02,
        how: '150 million users × 2 posts = 300 million', hint: 'Daily users times posts per user.' },
      { id: 'qps', label: 'Average QPS', ask: 'How many posts per second, on average?', unit: 'posts/s', answer: 3472, tol: 0.15,
        how: '300 million ÷ 86,400 seconds ≈ 3,500. Rounding a day to 100,000 s gives 3,000, still close enough.', hint: 'A day has 24 × 3,600 = 86,400 seconds. Round it to something easy.' },
      { id: 'peak', label: 'Peak QPS', ask: 'What load must the system handle at peak?', unit: 'posts/s', answer: 6944, tol: 0.15,
        how: '2 × 3,500 ≈ 7,000', hint: 'The assumptions say peak is double the average.' },
      { id: 'media-day', label: 'Media per day', ask: 'How much new media is stored each day?', unit: 'TB/day', answer: 30, tol: 0.1,
        how: '150 million × 2 posts × 10% × 1 MB = 30 million MB = 30 TB', hint: 'Only 10% of posts carry media. 1 million MB is 1 TB.' },
      { id: 'media-5y', label: 'Media over 5 years', ask: 'How much media is stored after 5 years?', unit: 'PB', answer: 54.75, tol: 0.15,
        how: '30 TB × 365 × 5 ≈ 55,000 TB = 55 PB', hint: 'Days per year times years, then convert: 1,000 TB is 1 PB.' },
    ],
  },
  {
    id: 'photos',
    title: 'A photo-sharing app',
    scenario: 'Same drill, a different shape: this app is read-heavy and the photos are big. Work out uploads, storage and the traffic leaving your servers.',
    assumptions: [
      '100 million monthly active users',
      '20% of them use the app every day',
      'Each daily user uploads 0.5 photos per day, 2 MB each',
      'Each daily user views 50 photos per day, served as 200 KB thumbnails',
    ],
    steps: [
      { id: 'dau', label: 'Daily active users', ask: 'How many people use the app on a typical day?', unit: 'users', answer: 20e6, tol: 0.02,
        how: '100 million × 20% = 20 million', hint: 'A fifth of the monthly users.' },
      { id: 'uploads', label: 'Uploads per day', ask: 'How many photos are uploaded per day?', unit: 'photos/day', answer: 10e6, tol: 0.02,
        how: '20 million × 0.5 = 10 million', hint: 'Daily users times uploads per user.' },
      { id: 'up-qps', label: 'Upload QPS', ask: 'How many uploads per second, on average?', unit: 'uploads/s', answer: 116, tol: 0.2,
        how: '10 million ÷ 86,400 ≈ 116. Using 100,000 for the day gives 100.', hint: 'Divide by the seconds in a day, and feel free to round it.' },
      { id: 'store-day', label: 'Storage per day', ask: 'How much new photo data is stored per day?', unit: 'TB/day', answer: 20, tol: 0.1,
        how: '10 million × 2 MB = 20 million MB = 20 TB', hint: 'Uploads times size per photo. 1 million MB is 1 TB.' },
      { id: 'store-year', label: 'Storage per year', ask: 'How much is stored after one year?', unit: 'PB', answer: 7.3, tol: 0.15,
        how: '20 TB × 365 = 7,300 TB ≈ 7.3 PB', hint: 'Daily storage times 365, then 1,000 TB is 1 PB.' },
      { id: 'egress', label: 'Outgoing bandwidth', ask: 'On average, how much data per second leaves your servers (before any CDN)?', unit: 'GB/s', answer: 2.31, tol: 0.2,
        how: '20 million users × 50 views = 1 billion views/day × 200 KB = 200 TB/day. 200 TB ÷ 86,400 s ≈ 2.3 GB/s.', hint: 'Views per day times thumbnail size, then divide by seconds in a day. This is why a CDN exists.' },
    ],
  },
]

