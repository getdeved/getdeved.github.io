import type { NodeDef, Topic } from '../types'

// Fixed canvas positions (1000x600) so the final diagram is laid out once, by hand.
const n = (id: string, label: string, icon: NodeDef['icon'], x: number, y: number, sub?: string): NodeDef =>
  ({ id, label, icon, x, y, sub })

export const scaling: Topic = {
  id: 'scaling',
  title: 'Scale from zero to millions of users',
  intro:
    'You start with one server. Each step below is a problem real systems hit as users grow. Pick the fix, see what it buys you and what it costs, and watch the architecture evolve.',
  recap: [
    'Keep the web tier stateless.',
    'Build redundancy at every tier: no single point of failure.',
    'Cache what is read often, and put static files on a CDN.',
    'Decouple slow work with queues.',
    'Scale the data tier by sharding when one database is not enough.',
    'Logs, metrics and automation are not optional once you have more than a few servers.',
  ],
  steps: [
