import { useState } from 'react'
import './playground.css'
import Builder from './Builder'
import Estimate from './Estimate'
import EstimationLearn from './EstimationLearn'
import Guided from './Guided'
import { InfoDialog, type Inspect } from './InfoDialog'
import { Nav } from './Nav'
import { lessons, tracks } from './catalog'
import { guidedTopics } from './topics'
import { autoSpec, scalingSpec } from './buildSpec'

export default function Playground({ topicId }: { topicId: string }) {
  const lesson = lessons[topicId]
  const [mode, setMode] = useState(lesson.modes[0].id)
  const [gen, setGen] = useState(0) // bump to remount Guided after a jump
  const [info, setInfo] = useState<Inspect | null>(null)

  const learn = (step: number) => {
    try { localStorage.setItem(`deved:${topicId}`, String(step)) } catch { /* jump still works for this visit only */ }
    setGen((g) => g + 1); setMode('guided'); window.scrollTo(0, 0)
  }

  const body =
    Object.hasOwn(guidedTopics, topicId) ? (mode === 'guided' || mode === 'quiz' ? <Guided key={`${gen}-${mode}`} topic={guidedTopics[topicId]} quiz={mode === 'quiz'} onInspect={setInfo} /> : <Builder key={topicId} spec={topicId === 'scaling' ? scalingSpec : autoSpec(guidedTopics[topicId])} onInspect={setInfo} onLearn={learn} />)
    : mode === 'learn' ? <EstimationLearn /> : <Estimate />

  return (
    <div className="pg">
      <Nav wide>
        <a className="link" href="#/glossary">Glossary</a>
        <a className="link" href="#/playground">All topics</a>
        <details className="topics">
          <summary>Topics</summary>
          <div className="topics-panel">
            {tracks.map((t) => (
              <div key={t.name}>
                <h3>{t.name}</h3>
                <ul>
                  {t.topics.map((x) => Object.hasOwn(lessons, x.id)
                    ? <li key={x.id}>{x.id === topicId ? <b>{x.title}</b> : <a href={`#/playground/${x.id}`}>{x.title}</a>}</li>
                    : <li key={x.id} className="soon">{x.title}<span>soon</span></li>)}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </Nav>
      <main className="play wide">
        <div className="modes" role="tablist" aria-label="Mode">
          {lesson.modes.map((m) => (
            <button key={m.id} role="tab" aria-selected={mode === m.id} className={mode === m.id ? 'on' : ''} onClick={() => setMode(m.id)}>{m.name}</button>
          ))}
          {lesson.soon.map((s) => <button key={s} role="tab" disabled>{s}<span>soon</span></button>)}
        </div>
        <p className="mode-blurb">{lesson.modes.find((m) => m.id === mode)!.blurb}</p>
        {body}
      </main>
      <InfoDialog info={info} onClose={() => setInfo(null)} />
    </div>
  )
}
