import { estimationIntro } from './topics/estimation'
import { scaling } from './topics/scaling'
import { guidedTopics } from './topics'

// Curriculum map (see PLAN.md). Topics in `lessons` are playable; the rest render as "soon".
// To add a topic: add it here, add a branch in Playground.tsx, and add its card to Overview.tsx's progress().
export type ModeDef = { id: string; name: string; blurb: string }
export const lessons: Record<string, { title: string; intro: string; modes: ModeDef[]; soon: string[] }> = {
  scaling: {
    title: scaling.title, intro: scaling.intro, soon: ['Break it', 'Sandbox'],
    modes: [
      { id: 'guided', name: 'Learn', blurb: 'Read one idea at a time and watch the design grow. No tests, no wrong answers.' },
      { id: 'build', name: 'Build & test', blurb: 'Drag components onto a canvas, then run failure scenarios against your design.' },
      { id: 'quiz', name: 'Quiz', blurb: 'Optional: choose the approach yourself first, then see why it works.' },
    ],
  },
  estimation: {
    title: 'Back-of-the-envelope estimation', intro: estimationIntro, soon: ['Latency sort'],
    modes: [
      { id: 'learn', name: 'Cheat sheet', blurb: 'The numbers worth memorising, made interactive.' },
      { id: 'estimate', name: 'Estimate', blurb: 'Size real systems from assumptions, one step at a time.' },
    ],
  },
}
// Every other diagram topic is playable in Guided mode only.
for (const [id, t] of Object.entries(guidedTopics)) {
  lessons[id] ??= { title: t.title, intro: t.intro, soon: ['Sandbox'], modes: [
    { id: 'guided', name: 'Learn', blurb: 'Read one idea at a time and watch the design grow. No tests, no wrong answers.' },
    { id: 'build', name: 'Build & test', blurb: 'Drag components onto a canvas and wire them up. Each challenge checks your design against one problem.' },
    { id: 'quiz', name: 'Quiz', blurb: 'Optional: choose the approach yourself first, then see why it works.' },
  ] }
}
