// Every diagram-based (Guided) topic, keyed by catalog id. Scaling also has Build & test; estimation is its own kind.
import type { Topic } from '../types'
import { adClicks, leaderboard, metrics, objectStorage } from './infra'
import { chat, autocomplete, drive, newsFeed, notifications, urlShortener, webCrawler, youtube } from './classic'
import { consistentHashing, framework, keyValue, messageQueue, rateLimiter, uniqueId } from './blocks'
import { email, exchange, hotel, payments, wallet } from './critical'
import { maps, nearbyFriends, proximity } from './location'
import { scaling } from './scaling'
import { extras1 } from './extras1'
import { extras2 } from './extras2'
import { extras3 } from './extras3'
import { extras4 } from './extras4'
import type { Extras } from './extras1'

const base: Record<string, Topic> = {
  scaling, framework, 'rate-limiter': rateLimiter, 'consistent-hashing': consistentHashing, 'key-value': keyValue,
  'unique-id': uniqueId, 'message-queue': messageQueue, 'url-shortener': urlShortener, 'web-crawler': webCrawler,
  notifications, 'news-feed': newsFeed, chat, autocomplete, youtube, drive, proximity, 'nearby-friends': nearbyFriends,
  maps, metrics, 'ad-clicks': adClicks, 'object-storage': objectStorage, leaderboard, hotel, email, payments, wallet, exchange,
}

// Extra, smaller steps are authored separately and slotted in after the step they build on.
const extras: Extras = { ...extras1, ...extras2, ...extras3, ...extras4 }
export const guidedTopics: Record<string, Topic> = Object.fromEntries(Object.entries(base).map(([id, t]) => {
  const add = extras[id]
  if (!add) return [id, t]
  for (const after of Object.keys(add)) if (!t.steps.some((s) => s.id === after)) throw new Error(`${id}: no step "${after}" to insert after`)
  return [id, { ...t, steps: t.steps.flatMap((s) => [s, ...(add[s.id] ?? [])]) }]
}))
