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
    step('wrap', 'Wrapping up',
      'A few minutes are left. What is the best use of them?',
      [
        best('recap', 'Summarise the design, name bottlenecks and failure modes, and suggest next steps', 'Right. A short recap with honest limitations and ideas for scaling shows you see the whole system, not just the parts you drew.',
          { add: [n('wrap', 'Wrap-up', 'clock', 5.6, 2, 'Step 4: recap decisions and trade-offs, discuss bottlenecks, error handling, monitoring and how it scales further.')], edges: ['deep>wrap'], d: { availability: 10 } }),
        alt('done', 'Say “that’s it” and stop', 'wrong', 'You leave the best chance to show breadth unused: failures, monitoring, scale-up.'),
        alt('redo', 'Start redesigning from scratch', 'wrong', 'Too late and it undermines the design you just defended.'),
      ],
      ['A typical 45-minute split: scope 3-10 min, high-level design 10-15, deep dive 10-25, wrap-up 3-5.', 'Do: ask, communicate, treat the interviewer as a teammate. Don’t: jump to solutions, go silent, over-engineer.'],
      'Here is my design for a news feed. Act as a reviewer: summarise it in five bullets, list the biggest bottlenecks and failure modes, and suggest what to build next.'),
  ],
  ['Understand and scope first.', 'Agree on a high-level design before details.', 'Deep-dive where it matters.', 'Always wrap up with trade-offs and next steps.'])

export const rateLimiter: Topic = topic('rate-limiter', 'Design a rate limiter',
  'Stop one client from drowning everyone else, protect your costs, and keep servers upright, without turning away honest users.',
  [
    step('place', 'Where should the limiter live?',
      'Your API gets abusive bursts from a few clients. You want to cap requests per client. Where do you enforce the limit?',
      [
        best('gateway', 'In middleware or an API gateway in front of the services', 'Right. One place that every request passes through, under your control, and independent of how many services sit behind it.',
          { add: [n('u', 'Clients', 'users', 0, 2, 'Anyone calling the API: apps, scripts, and sometimes abusers.'), n('rl', 'Rate limiter', 'gauge', 2.5, 2, 'Middleware that counts requests per client and rejects the ones over the limit.'), n('api', 'API servers', 'server', 5, 2, 'The services doing the real work, protected from floods.')], edges: ['u>rl', 'rl>api'], d: { availability: 15, capacity: 10 } }),
        alt('client', 'In the client app', 'wrong', 'Clients are not under your control. A malicious one just skips the check.'),
        alt('each', 'Separately inside every service', 'ok', 'It works but duplicates logic and drifts apart. Shared enforcement is easier to keep consistent.'),
      ],
      ['Server-side or gateway enforcement is reliable; client-side is not.', 'Managed API gateways often include rate limiting plus authentication and TLS termination.'],
      'Add a rate-limiting middleware to my API gateway that limits each API key to 100 requests per minute and returns a clear error when exceeded.'),
