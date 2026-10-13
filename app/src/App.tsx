import { useEffect, useState } from 'react'
import Glossary from './Glossary'
import Landing from './Landing'
import Overview from './Overview'
import Playground from './Playground'
import { lessons } from './catalog'

export default function App() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const f = () => { setHash(location.hash); if (location.hash !== '#curriculum') window.scrollTo(0, 0) }
    addEventListener('hashchange', f)
    return () => removeEventListener('hashchange', f)
  }, [])
  if (hash.startsWith('#/glossary')) return <Glossary />
  const id = hash.startsWith('#/playground/') ? hash.split('/')[2] : ''
  if (id in lessons) return <Playground key={id} topicId={id} />
  return hash.startsWith('#/playground') ? <Overview /> : <Landing />
}
