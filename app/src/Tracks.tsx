import { playable, tracks } from './catalog'
import { guidedTopics } from './topics'
import { problems } from './topics/estimation'

// "3/5" once started, "done" when finished; falls back to "playable" for the landing page.
function label(id: string, progress: boolean): string {
  if (!progress) return 'playable'
  const total = guidedTopics[id]?.steps.length ?? problems.length
  let done = 0
  try { done = Number(localStorage.getItem(`deved:${id}`)) || 0 } catch { /* no saved progress */ }
  return done >= total ? 'done' : done > 0 ? `${done}/${total}` : `${total} ${id in guidedTopics ? 'steps' : 'problems'}`
}

export function Tracks({ progress = false }: { progress?: boolean }) {
  return (
    <div className="tracks">
      {tracks.map((t) => (
        <div className="track" key={t.name}>
          <h3>{t.name}</h3>
          <ul>
            {t.topics.map((x) => playable.includes(x.id)
              ? <li key={x.id}><a href={`#/playground/${x.id}`}>{x.title}</a><span className="status live">{label(x.id, progress)}</span></li>
              : <li key={x.id} className="soon">{x.title}<span className="status">soon</span></li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}
