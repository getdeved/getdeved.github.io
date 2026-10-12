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
    topicId in guidedTopics ? (mode === 'guided' || mode === 'quiz' ? <Guided key={`${gen}-${mode}`} topic={guidedTopics[topicId]} quiz={mode === 'quiz'} onInspect={setInfo} /> : <Builder key={topicId} spec={topicId === 'scaling' ? scalingSpec : autoSpec(guidedTopics[topicId])} onInspect={setInfo} onLearn={learn} />)
    : mode === 'learn' ? <EstimationLearn /> : <Estimate />

