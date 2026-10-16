import { useState } from 'react'
import { Check, Circle } from 'lucide-react'
import { fmt, parseNum, problems, within } from './topics/estimation'

const KEY = 'deved:estimation'
type Done = { value: number; how: boolean; first: boolean } // how: answer was revealed; first: right on first try

export default function Estimate() {
  const [p, setP] = useState(0)
  const [s, setS] = useState(0)
  const [done, setDone] = useState<Record<string, Done>>({})
  const [text, setText] = useState('')
  const [tries, setTries] = useState(0)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'fail'; text: string } | null>(null)
  const [finishedProblems, setFinished] = useState(0)

  const problem = problems[p]
  const q = problem.steps[s]
  const over = finishedProblems >= problems.length
  const solved = msg?.kind === 'ok' || (!!q && !!done[q.id]?.how)

