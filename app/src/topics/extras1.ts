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
