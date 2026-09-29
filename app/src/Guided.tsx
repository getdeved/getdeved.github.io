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

