import type { Topic } from '../types'
import { alt, best, n, step, topic } from './dsl'

export const framework: Topic = topic('framework', 'A framework for system design',
  'A design question is vague on purpose. This is the four-move routine that turns it into a conversation you can steer, and the habits that keep you from rambling or going silent.',
  [
    step('scope', 'You are told: “design a news feed”',
      'There is a whiteboard and 45 minutes. The question is one sentence long. What do you do first?',
      [
        best('ask', 'Ask clarifying questions and write down the assumptions', 'Right. The question is deliberately underspecified. Asking about features, scale and constraints shows judgment, and the written assumptions give you something to design against.',
          { add: [n('scope', 'Scope', 'doc', 0.4, 2, 'Step 1: understand the problem. Features, users, scale, constraints and assumptions, agreed before any boxes are drawn.')], d: { capacity: 10 } }),
        alt('draw', 'Start drawing boxes straight away', 'wrong', 'Designing before you know the requirements is the classic mistake. You will build the wrong thing, confidently.'),
        alt('guess', 'Silently decide the requirements yourself', 'premature', 'You skip the conversation that is half of what is being assessed, and risk solving a different problem from the one asked.'),
      ],
      ['Good questions: which features matter most, how many users, mobile or web, what scale in 3 months and in a year, which existing services can be reused.', 'Write assumptions down. You will want them when you estimate.'],
      'I am designing a news feed. List the clarifying questions I should ask about features, scale and constraints before designing, and why each one changes the design.'),
    step('hld', 'Requirements are clear. Now what?',
      'You agreed on features and scale. The interviewer is nodding. What is the next move?',
      [
        best('blueprint', 'Sketch a high-level design, estimate roughly, and walk the main use cases', 'Right. A blueprint of the key components, a quick back-of-the-envelope check and a walk through the main flows give both of you something to agree on, and expose gaps early.',
          { add: [n('design', 'High-level design', 'layers', 2.2, 2, 'Step 2: boxes for the key components, a rough estimate, and the main flows walked end to end. Agree on it before going deeper.')], edges: ['scope>design'], d: { capacity: 10, speed: 5 } }),
        alt('dive', 'Dive into database indexing details', 'wrong', 'You have no agreed design to dive into yet. Detail without a blueprint is noise.'),
        alt('cache', 'Optimise the caching strategy', 'premature', 'Premature. Caches solve problems you have not found yet because the overall design does not exist.'),
      ],
      ['Check in with the interviewer: is this the shape they had in mind?', 'Walking use cases (publishing a post, loading a feed) exposes edge cases the boxes alone hide.'],
      'Given these requirements for a news feed, propose a high-level design: components, data flow for publishing and reading, and a rough estimate of QPS and storage.'),
    step('deep', 'Time to go deep',
      'The blueprint is agreed and about 20 minutes remain. Where do you spend them?',
      [
        best('priority', 'Agree with the interviewer on the most important components and go deep on those', 'Right. You cannot cover everything. Choosing the hardest or most important parts, such as fan-out for a feed or hash design for a URL shortener, shows depth where it counts.',
          { add: [n('deep', 'Deep dive', 'search', 3.9, 2, 'Step 3: detail on the components that matter most, plus bottlenecks and trade-offs.')], edges: ['design>deep'], d: { capacity: 10, speed: 5 } }),
        alt('all', 'Detail every component equally', 'wrong', 'You will run out of time and bury the interesting parts.'),
        alt('known', 'Pick whichever topic you know best', 'ok', 'Showing strength is fine, but the interviewer’s priorities matter. Ask which area they care about.'),
      ],
      ['Prioritise by what is hardest or riskiest for this problem.', 'Name bottlenecks and propose fixes; do not over-engineer.'],
      'For a news feed design, identify the two or three most interesting deep-dive areas and the trade-offs in each (for example fan-out on write vs read).'),
