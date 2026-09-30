import { useState } from 'react'
import type { Inspect } from './InfoDialog'
import { Diagram, kindOf } from './Diagram'
import { buildDesign } from './engine'
import type { Metrics, Option, Topic } from './types'

const BADGE: Record<Option['verdict'], string> = {
  best: 'Best fit', ok: 'Works, with limits', premature: 'Premature', wrong: 'Doesn’t solve this',
}
const ALT_TAG: Record<Option['verdict'], string> = { best: '', ok: 'works, with limits', premature: 'too early', wrong: 'misses the problem' }

// In lesson mode the situation is shown as a statement of the problem, so drop any trailing question sentence.
const statement = (s: string) => {
  const kept = (s.match(/[^.?!]+[.?!]+/g) ?? [s]).filter((x) => !x.trim().endsWith('?')).join('').trim()
  return kept || s
}
const unRight = (s: string) => s.replace(/^Right\.\s*/, '')
const METERS: [keyof Metrics, string][] = [
  ['capacity', 'Capacity'], ['availability', 'Availability'], ['speed', 'Speed'], ['complexity', 'Complexity'],
]

function loadStep(topic: Topic) {
  try {
    const v = Number(localStorage.getItem(`deved:${topic.id}`))
    return Number.isInteger(v) && v >= 0 && v <= topic.steps.length ? v : 0
  } catch { return 0 }
}

export default function Guided({ topic, quiz = false, onInspect }: { topic: Topic; quiz?: boolean; onInspect: (i: Inspect) => void }) {
  const [idx, setIdx] = useState(() => loadStep(topic))
  const [tried, setTried] = useState<string[]>([])
  const [shown, setShown] = useState(false) // lesson mode: has the diagram been updated for this step?
  const finished = idx >= topic.steps.length
  const step = topic.steps[idx]
  const best = step?.options.find((o) => o.verdict === 'best')
  const solved = !finished && (quiz ? tried.some((id) => step.options.find((o) => o.id === id)?.verdict === 'best') : shown)
  const design = buildDesign(topic.steps, idx + (solved ? 1 : 0))

  const go = (i: number, revisit = false) => {
    setIdx(i); setTried([]); setShown(revisit)
    try { localStorage.setItem(`deved:${topic.id}`, String(i)) } catch { /* progress just won't persist */ }
  }

