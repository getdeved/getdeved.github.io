import { useState } from 'react'
import { downtime, fmtNs, humanize, latency, latencyLessons, nines, powers, tips } from './topics/estimation'

const lo = Math.log10(0.5), hi = Math.log10(150_000_000)

export default function EstimationLearn() {
  const [scaled, setScaled] = useState(false)
  const [n, setN] = useState(1)
  const d = downtime(nines[n].a)

  return (
    <div className="mode">
      <div className="build-grid guided">
        <aside className="card docked">
          <h1>Four habits</h1>
          <p className="hint">What separates a useful estimate from a wild guess.</p>
          <dl className="tips">
            {tips.map((t) => (<div key={t.title}><dt>{t.title}</dt><dd>{t.body}</dd></div>))}
          </dl>
        </aside>

        <div className="build-main scroll">
          <section className="stage">
            <h2>Powers of two</h2>
            <p className="hint">Data sizes double up in steps of 2¹⁰ ≈ one thousand. One ASCII character is one byte.</p>
            <table className="ref">
              <thead><tr><th>Power</th><th>Approx. value</th><th>Unit</th></tr></thead>
              <tbody>{powers.map((p) => (<tr key={p.exp}><td>2<sup>{p.exp}</sup></td><td>{p.approx}</td><td><b>{p.unit}</b></td></tr>))}</tbody>
            </table>
          </section>

