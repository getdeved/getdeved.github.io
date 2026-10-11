import { Nav } from './Nav'
import { Tracks } from './Tracks'
import { topicCount } from './catalog'

export default function Overview() {
  return (
    <>
      <Nav>
        <a className="link" href="#/glossary">Glossary</a>
      </Nav>
      <main className="landing overview">
        <h1>Playground</h1>
        <p className="lead">{topicCount} topics, from one server to a stock exchange. Pick any: each one walks you through the decisions, one at a time. Scaling and estimation have extra modes to practise in.</p>
        <Tracks progress />
      </main>
    </>
  )
}
