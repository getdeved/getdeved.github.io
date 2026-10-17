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

  const check = () => {
    const v = parseNum(text)
    if (v === null) return setMsg({ kind: 'fail', text: `Enter just the number in ${q.unit}, for example 3500, 3.5k or 150M.` })
    if (within(v, q)) {
      setDone({ ...done, [q.id]: { value: v, how: false, first: tries === 0 } })
      return setMsg({ kind: 'ok', text: 'Close enough. Estimates don’t need every digit.' })
    }
    const r = v / q.answer
    const off = r > 1 ? `about ${r >= 10 ? Math.round(r) : +r.toFixed(1)}× too high` : `about ${1 / r >= 10 ? Math.round(1 / r) : +(1 / r).toFixed(1)}× too low`
    setTries(tries + 1)
    setMsg({ kind: 'fail', text: `Not quite, ${off}. ${q.hint}` })
  }
  const reveal = () => {
    setDone({ ...done, [q.id]: { value: q.answer, how: true, first: false } })
    setMsg({ kind: 'fail', text: `The answer is about ${fmt(q.answer)} ${q.unit}.` })
  }
  const next = () => {
    setText(''); setTries(0); setMsg(null)
    if (s + 1 < problem.steps.length) return setS(s + 1)
    const f = finishedProblems + 1
    setFinished(f)
    try { localStorage.setItem(KEY, String(f)) } catch { /* progress just won't persist */ }
    if (p + 1 < problems.length) { setP(p + 1); setS(0); setDone({}) } else setS(s + 1)
  }
  const restart = () => { setP(0); setS(0); setDone({}); setText(''); setTries(0); setMsg(null); setFinished(0) }

  return (
    <div className="mode">
      <div className="build-grid guided">
        <aside className="card docked">
          {over ? (
            <>
              <p className="eyebrow">All problems done</p>
              <h1>Nicely estimated</h1>
              <p>You sized two systems from nothing but assumptions. The same four moves apply to any system: users, requests, bytes, bandwidth.</p>
              <button className="run" onClick={restart}>Practise again</button>
            </>
          ) : (
            <>
              <p className="eyebrow">Problem {p + 1} of {problems.length}</p>
              <h1>{problem.title}</h1>
              <p>{problem.scenario}</p>
              <h3>Assumptions</h3>
              <ul className="assume">{problem.assumptions.map((a) => <li key={a}>{a}</li>)}</ul>
              <p className="hint">Answer in the unit shown. Round freely: within about {Math.round(q.tol * 100)}% counts. You can type 3.5k, 150M, 2b.</p>
            </>
          )}
        </aside>

