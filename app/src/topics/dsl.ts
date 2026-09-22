// Compact authoring helpers so a topic is mostly content. Layout is a column/row grid (0-6 by 0-5)
// that maps onto the 1000x600 canvas, so topics never hand-place pixels.
import type { IconName } from '../icons'
import type { EdgeDef, Metrics, NodeDef, Option, Step, Topic, Verdict } from '../types'

export const n = (id: string, label: string, icon: IconName, col: number, row: number, tip: string, sub?: string): NodeDef =>
  ({ id, label, icon, x: Math.round(70 + col * 143), y: Math.round(60 + row * 98), tip, sub })

// "a>b", "a>b:label", "a>>b:label" (double arrow = dashed)
const edge = (s: string): EdgeDef => {
  const m = s.match(/^(\w+)(>>?)(\w+)(?::(.*))?$/)
  if (!m) throw new Error(`bad edge ${s}`)
  return { from: m[1], to: m[3], label: m[4], dashed: m[2] === '>>' || undefined }
}

type Effect = { add?: NodeDef[]; edges?: string[]; remove?: string[]; cut?: string[]; d?: Partial<Metrics> }

export const best = (id: string, label: string, feedback: string, e: Effect = {}): Option => ({
  id, label, verdict: 'best', feedback, remove: e.remove, cut: e.cut, delta: e.d,
  add: { nodes: e.add, edges: e.edges?.map(edge) },
})
export const alt = (id: string, label: string, verdict: Exclude<Verdict, 'best'>, feedback: string): Option => ({ id, label, verdict, feedback })

// Deterministic shuffle so the best answer is not always listed first.
const rank = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7)

export const step = (id: string, title: string, situation: string, options: Option[], underTheHood: string[], llmPrompt: string): Step => ({
  id, title, situation, underTheHood, llmPrompt,
  options: [...options].sort((a, b) => rank(id + a.id) - rank(id + b.id)),
})

export const topic = (id: string, title: string, intro: string, steps: Step[], recap: string[]): Topic => ({ id, title, intro, steps, recap })
