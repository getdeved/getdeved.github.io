import { useMemo, useState } from 'react'
import { Nav } from './Nav'
import { lessons } from './catalog'
import { terms } from './glossaryTerms'

const FILTERS = [['all', 'All'], ['acronym', 'Acronyms'], ['concept', 'Concepts']] as const

export default function Glossary() {
  const [q, setQ] = useState('')
  const [f, setF] = useState<(typeof FILTERS)[number][0]>('all')

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase()
    return [...terms]
      .filter((t) => f === 'all' || (f === 'acronym') === !!t.full)
      .filter((t) => !s || `${t.term} ${t.full ?? ''} ${t.def}`.toLowerCase().includes(s))
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [q, f])

  return (
    <>
      <Nav>
        <a className="link" href="#/playground">Playground</a>
      </Nav>
      <main className="landing glossary">
        <h1>Glossary</h1>
        <p className="lead">The words, acronyms and shortcuts you will hear in system design, in plain English. Each one points to where it is used.</p>
        <div className="gl-tools">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms, e.g. TTL, quorum, cache" aria-label="Search the glossary" />
          <div className="chips" role="group" aria-label="Filter">
            {FILTERS.map(([id, name]) => (
              <button key={id} className={f === id ? 'on' : ''} aria-pressed={f === id} onClick={() => setF(id)}>{name}</button>
            ))}
          </div>
          <span className="gl-count" role="status">{shown.length} of {terms.length}</span>
        </div>
        <dl className="gl-list">
          {shown.map((t) => (
            <div key={t.term} id={t.term}>
              <dt>{t.term}{t.full && <small>{t.full}</small>}</dt>
              <dd>
                <p>{t.def}</p>
                {!!t.topics?.length && (
                  <p className="gl-topics">
                    {t.topics.filter((id) => id in lessons).map((id) => <a key={id} href={`#/playground/${id}`}>{lessons[id].title}</a>)}
                  </p>
                )}
              </dd>
            </div>
          ))}
          {!shown.length && <p className="hint">Nothing matches “{q}”.</p>}
        </dl>
      </main>
    </>
  )
}
