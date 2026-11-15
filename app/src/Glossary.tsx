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

