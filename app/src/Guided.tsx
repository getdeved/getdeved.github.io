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

  return (
    <>
    <div className="mode">
      <div className="build-grid guided">
        <aside className="card docked">
      <header>
        <h1>{topic.title}</h1>
        <p>{topic.intro}</p>
        <progress value={idx} max={topic.steps.length} aria-label="Progress" />
      </header>
          {finished ? (
            <>
              <p className="eyebrow">Done</p>
              <h2>Topic complete</h2>
              <ul>{topic.recap.map((r) => <li key={r}>{r}</li>)}</ul>
              <p className="hint">Look at the diagram: which box is still a single point of failure? Click any box to read about it.</p>
              <button onClick={() => go(0)}>Start over</button>
            </>
          ) : (
            <>
              {quiz ? (
                <>
              <p className="eyebrow">Step {idx + 1} of {topic.steps.length}</p>
              <h2>{step.title}</h2>
              <p>{step.situation}</p>
              <div className="options">
                {step.options.map((o) => {
                  const picked = tried.includes(o.id)
                  return (
                    <div key={o.id}>
                      <button className={`opt ${picked ? o.verdict : ''}`} disabled={solved} onClick={() => !picked && setTried([...tried, o.id])}>
                        {o.label}
                      </button>
                      {picked && <p className={`feedback ${o.verdict}`}><b>{BADGE[o.verdict]}.</b> {o.feedback}</p>}
                    </div>
                  )
                })}
              </div>
              {solved && (
                <>
                  <h3>Under the hood</h3>
                  <ul>{step.underTheHood.map((t) => <li key={t}>{t}</li>)}</ul>
                  <h3>Now you can ask your LLM</h3>
                  <blockquote>{step.llmPrompt}</blockquote>
                  <button onClick={() => go(idx + 1)}>{idx + 1 === topic.steps.length ? 'Finish' : 'Next step'}</button>
                </>
              )}
                </>
              ) : (
                <>
              <p className="eyebrow">Step {idx + 1} of {topic.steps.length}</p>
              <h2>{step.title}</h2>
              <h3>The problem</h3>
              <p>{statement(step.situation)}</p>
              <h3>The approach</h3>
              <p className="idea"><b>{best!.label}</b></p>
              <p>{unRight(best!.feedback)}</p>
              <h3>Other approaches</h3>
              <ul className="alts">
                {step.options.filter((o) => o.verdict !== 'best').map((o) => (
                  <li key={o.id}><b>{o.label}</b> <span className={`tag ${o.verdict}`}>{ALT_TAG[o.verdict]}</span><br />{o.feedback}</li>
                ))}
              </ul>
              <h3>Under the hood</h3>
              <ul>{step.underTheHood.map((t) => <li key={t}>{t}</li>)}</ul>
              <h3>Ask your LLM</h3>
              <blockquote>{step.llmPrompt}</blockquote>
              <div className="lesson-actions">
                {idx > 0 && <button onClick={() => go(idx - 1, true)}>Back</button>}
                {solved
                  ? <button className="run" onClick={() => go(idx + 1)}>{idx + 1 === topic.steps.length ? 'Finish' : 'Next step'}</button>
                  : <button className="run" onClick={() => setShown(true)}>Show it on the diagram</button>}
              </div>
                </>
              )}
            </>
          )}
        </aside>
        <div className="build-main">
        <section className="stage">
          <Diagram design={design} onNodeClick={(n) => onInspect({ kind: kindOf(n), name: n.label, tip: n.tip })} />
          <div className="meters">
            {METERS.map(([k, label]) => (
              <div key={k} className={`meter ${k}`}>
                <span>{label}</span>
                <div className="bar"><i style={{ width: `${Math.min(100, design.metrics[k])}%` }} /></div>
                <b>{design.metrics[k]}</b>
              </div>
            ))}
          </div>
          <p className="hint stage-hint">Click any box to learn what it is.</p>
        </section>
        </div>
      </div>
    </div>
    </>
  )
}
