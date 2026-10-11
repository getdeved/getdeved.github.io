import { estimationIntro } from './topics/estimation'
import { scaling } from './topics/scaling'
import { guidedTopics } from './topics'

// Curriculum map (see PLAN.md). Topics in `lessons` are playable; the rest render as "soon".
// To add a topic: add it here, add a branch in Playground.tsx, and add its card to Overview.tsx's progress().
export type ModeDef = { id: string; name: string; blurb: string }
export const lessons: Record<string, { title: string; intro: string; modes: ModeDef[]; soon: string[] }> = {
  scaling: {
    title: scaling.title, intro: scaling.intro, soon: ['Break it', 'Sandbox'],
    modes: [
      { id: 'guided', name: 'Learn', blurb: 'Read one idea at a time and watch the design grow. No tests, no wrong answers.' },
      { id: 'build', name: 'Build & test', blurb: 'Drag components onto a canvas, then run failure scenarios against your design.' },
      { id: 'quiz', name: 'Quiz', blurb: 'Optional: choose the approach yourself first, then see why it works.' },
    ],
  },
  estimation: {
    title: 'Back-of-the-envelope estimation', intro: estimationIntro, soon: ['Latency sort'],
    modes: [
      { id: 'learn', name: 'Cheat sheet', blurb: 'The numbers worth memorising, made interactive.' },
      { id: 'estimate', name: 'Estimate', blurb: 'Size real systems from assumptions, one step at a time.' },
    ],
  },
}
// Every other diagram topic is playable in Guided mode only.
for (const [id, t] of Object.entries(guidedTopics)) {
  lessons[id] ??= { title: t.title, intro: t.intro, soon: ['Sandbox'], modes: [
    { id: 'guided', name: 'Learn', blurb: 'Read one idea at a time and watch the design grow. No tests, no wrong answers.' },
    { id: 'build', name: 'Build & test', blurb: 'Drag components onto a canvas and wire them up. Each challenge checks your design against one problem.' },
    { id: 'quiz', name: 'Quiz', blurb: 'Optional: choose the approach yourself first, then see why it works.' },
  ] }
}
export const playable = Object.keys(lessons)

export const tracks: { name: string; topics: { id: string; title: string }[] }[] = [
  { name: 'Foundations', topics: [
    { id: 'scaling', title: 'Scale from zero to millions of users' },
    { id: 'estimation', title: 'Back-of-the-envelope estimation' },
    { id: 'framework', title: 'A framework for system design' },
  ] },
  { name: 'Building blocks', topics: [
    { id: 'consistent-hashing', title: 'Consistent hashing' },
    { id: 'key-value', title: 'Key-value store' },
    { id: 'unique-id', title: 'Unique ID generator' },
    { id: 'rate-limiter', title: 'Rate limiter' },
    { id: 'message-queue', title: 'Distributed message queue' },
  ] },
  { name: 'Classic systems', topics: [
    { id: 'url-shortener', title: 'URL shortener' },
    { id: 'web-crawler', title: 'Web crawler' },
    { id: 'notifications', title: 'Notification system' },
    { id: 'news-feed', title: 'News feed' },
    { id: 'chat', title: 'Chat system' },
    { id: 'autocomplete', title: 'Search autocomplete' },
    { id: 'youtube', title: 'YouTube' },
    { id: 'drive', title: 'Google Drive' },
  ] },
  { name: 'Location', topics: [
    { id: 'proximity', title: 'Proximity service' },
    { id: 'nearby-friends', title: 'Nearby friends' },
    { id: 'maps', title: 'Google Maps' },
  ] },
  { name: 'Data and infrastructure', topics: [
    { id: 'metrics', title: 'Metrics and alerting' },
    { id: 'ad-clicks', title: 'Ad click aggregation' },
    { id: 'object-storage', title: 'S3-like object storage' },
    { id: 'leaderboard', title: 'Real-time leaderboard' },
  ] },
  { name: 'Correctness-critical', topics: [
    { id: 'hotel', title: 'Hotel reservation' },
    { id: 'email', title: 'Distributed email' },
    { id: 'payments', title: 'Payment system' },
    { id: 'wallet', title: 'Digital wallet' },
    { id: 'exchange', title: 'Stock exchange' },
  ] },
]

export const topicCount = tracks.reduce((n, t) => n + t.topics.length, 0)
