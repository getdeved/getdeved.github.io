import type { IconName } from './icons'

export type Verdict = 'best' | 'ok' | 'premature' | 'wrong'

export type Metrics = { capacity: number; availability: number; speed: number; complexity: number }

// kind keys the glossary popup (defaults to the icon name); tip is a topic-specific popup text that overrides it.
export type NodeDef = { id: string; label: string; icon: IconName; x: number; y: number; sub?: string; kind?: string; tip?: string }
export type EdgeDef = { from: string; to: string; label?: string; dashed?: boolean }

export type Option = {
  id: string
  label: string
  verdict: Verdict
  feedback: string
  // Effects only apply to the 'best' option; the others teach through feedback.
  add?: { nodes?: NodeDef[]; edges?: EdgeDef[] }
  remove?: string[] // node ids; edges touching them go too
  cut?: string[] // edges to drop, written "from>to"
  delta?: Partial<Metrics>
}

export type Step = {
  id: string
  title: string
  situation: string
  options: Option[]
  underTheHood: string[]
  llmPrompt: string
}

export type Topic = { id: string; title: string; intro: string; steps: Step[]; recap: string[] }
