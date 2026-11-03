import type { Step } from '../types'
import { alt, best, n, step } from './dsl'

export type Extras = Record<string, Record<string, Step[]>>

export const extras1: Extras = {
  framework: {
    scope: [
      step('questions', 'Which questions are worth asking?', 'You may ask a handful of questions. Which ones help most?', [
        best('good', 'Features, who the users are, the scale, and any constraints', 'Right. Those four decide the architecture: what to build, for whom, how big, and within what limits.', { add: [n('req', 'Requirements', 'filter', 0.4, 3.4, 'The agreed list of features, users, scale and constraints.')], edges: ['scope>req'] }),
        alt('one', 'Only repeat back the one feature in the question', 'wrong', 'You learn nothing new, and miss the scale and constraints that drive the design.'),
        alt('bio', 'Ask about the interviewer’s experience', 'wrong', 'Friendly, but it does not clarify the problem.'),
      ], ['Example questions: mobile or web? Which features matter? How many users now and in a year? Is there existing infrastructure to reuse?'], 'List ten clarifying questions for “design a chat app”, grouped into features, scale, constraints and non-functional needs.'),
      step('assume', 'Where do assumptions go?', 'You decide a few things yourself, such as “friends lists are capped at 5,000”. What do you do with them?', [
        best('write', 'Write them down where both of you can see them', 'Right. Written assumptions can be challenged, corrected, and referred back to when you estimate.', { add: [n('as', 'Assumptions', 'doc', 0.4, 4.4, 'A visible list of the guesses your design stands on.')], edges: ['req>as'] }),
        alt('keep', 'Keep them in your head', 'wrong', 'Unstated assumptions cause silent disagreements and mistakes in your numbers.'),
        alt('skip', 'Avoid assuming anything and wait to be told', 'ok', 'Cautious, but some assumptions are inevitable. Say them out loud instead.'),
      ], ['Write them where you can reuse them in the back-of-the-envelope estimate.'], 'Turn these requirements into a numbered list of explicit assumptions with units, ready to use in an estimate.'),
    ],
    hld: [
      step('estimate', 'Do you need numbers?', 'The blueprint is drawn. Should you estimate traffic and storage now?', [
        best('yes', 'Yes: a quick back-of-the-envelope check of QPS and storage', 'Right. Rough numbers tell you whether one database is enough or whether caching and sharding are needed, before you commit to the design.', { add: [n('est', 'Estimates', 'chart', 2.2, 3.4, 'Rough QPS, storage and bandwidth numbers used to sanity-check the design.')], edges: ['design>est'] }),
        alt('no', 'No, estimates are guesses', 'wrong', 'Guesses with units are far better than none: they steer the design.'),
        alt('exact', 'Yes, but compute exact figures', 'wrong', 'Precision is not expected; round numbers and show the method.'),
      ], ['Only estimate when the interviewer wants it. Ask first.'], 'Estimate QPS, peak QPS and 5-year storage for a news feed with 10 million daily users, showing each assumption.'),
      step('usecases', 'Walk through the use cases', 'You have boxes and arrows. How do you check they are right?', [
        best('walk', 'Walk each main use case through the design end to end', 'Right. Following “publish a post” and “read my feed” step by step reveals missing components and wrong arrows.', { add: [n('uc', 'Use cases', 'send', 2.2, 0.6, 'The main flows traced through the blueprint to find gaps.')], edges: ['design>>uc'] }),
        alt('trust', 'Trust that the boxes look right', 'wrong', 'Gaps only show up when something actually flows through.'),
        alt('edge', 'Start with the rarest edge cases', 'premature', 'Cover the main flows first. Edge cases come later.'),
      ], ['Two flows for a feed: publishing and retrieval.'], 'Trace “user publishes a post” and “user opens feed” through my design as numbered steps, and list any component the flows reveal is missing.'),
    ],
    deep: [
      step('bottlenecks', 'Name the bottlenecks', 'You are deep in one component. What else belongs in this phase?', [
        best('bn', 'Say where it could fail or slow down, and how you would fix it', 'Right. Naming bottlenecks and proposing fixes is the heart of the deep dive.', { add: [n('bn', 'Bottlenecks', 'gauge', 3.9, 3.4, 'Where the design could fail or slow down, with proposed mitigations.')], edges: ['deep>bn'] }),
        alt('perfect', 'Claim the design has no bottlenecks', 'wrong', 'Every design has limits. Admitting them shows judgment.'),
        alt('later', 'Leave it to the wrap-up', 'ok', 'Wrap-up is a good place to revisit them, but discussing them in context is stronger.'),
      ], ['Balance detail: avoid over-engineering.'], 'List the likely bottlenecks in a news feed fan-out design and one mitigation for each.'),
    ],
    wrap: [
      step('time', 'Managing the clock', 'You have 45 minutes. How do you split them?', [
        best('split', 'Roughly: scope 5-10, high-level 10-15, deep dive 10-25, wrap-up 3-5', 'Right. Most of the time goes to design and depth; scope and wrap-up are short but never skipped.'),
        alt('diagram', 'Spend 30 minutes perfecting the diagram', 'wrong', 'You will have no time for the deep dive, which is where depth shows.'),
        alt('rush', 'Spend 2 minutes on scope to save time', 'wrong', 'Rushing scope risks designing the wrong thing.'),
      ], ['Keep the interviewer in the loop: do not go silent.'], 'Draft a 45-minute plan for a system design interview with time boxes and what to say in each.'),
    ],
  },

  'rate-limiter': {
    place: [
      step('rules', 'Where do the limits come from?', 'Different APIs need different limits. Where does the limiter learn them?', [
        best('config', 'Rules in a config store, loaded and cached by the limiter', 'Right. Rules are data, not code: changing a limit does not need a deploy, and caching keeps checks fast.', { add: [n('rules', 'Rules', 'doc', 2.5, 0.5, 'Config describing the limit per API, user or client, such as 100 requests per minute.')], edges: ['rules>rl'] }),
        alt('hard', 'Hard-code limits in the source', 'ok', 'Works at first but every change needs a deploy.'),
        alt('db', 'Ask the database for the rule on every request', 'wrong', 'Adds a slow lookup to the hottest path.'),
      ], ['Rules often live as files on disk, pulled into a cache.'], 'Design a YAML rules format for per-endpoint, per-user rate limits and a loader that caches it.'),
    ],
    algo: [
      step('bucket', 'Sizing a token bucket', 'You chose a token bucket. What do its two numbers control?', [
        best('size', 'Bucket size sets the allowed burst; refill rate sets the sustained average', 'Right. A bucket of 10 refilling at 1 per second allows 10 at once, then one per second.'),
        alt('swap', 'Bucket size is the average rate; refill rate is the burst', 'wrong', 'The other way around.'),
        alt('one', 'Only one number matters', 'wrong', 'You need both to describe burst and average.'),
      ], ['Different endpoints often get different buckets, and sometimes buckets per user or per IP.'], 'For a token bucket allowing 5 requests/second with bursts of 20, what are the bucket size and refill rate, and what happens after 30 requests in one second?'),
