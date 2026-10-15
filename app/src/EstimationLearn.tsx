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

          <section className="stage">
            <div className="sect-head">
              <h2>Latency numbers</h2>
              <button className="toggle" aria-pressed={scaled} onClick={() => setScaled(!scaled)}>
                {scaled ? 'Showing: if L1 took 1 second' : 'Showing: real time'}
              </button>
            </div>
            <p className="hint">Bars are on a log scale: each step right is roughly ten times slower. Try the toggle to feel it.</p>
            <ul className="bars">
              {latency.map((l) => (
                <li key={l.name}>
                  <span>{l.name}</span>
                  <div className="bar"><i style={{ width: `${5 + 95 * (Math.log10(l.ns) - lo) / (hi - lo)}%` }} /></div>
                  <b>{scaled ? humanize(l.ns) : fmtNs(l.ns)}</b>
                </li>
              ))}
            </ul>
            <ul className="lessons">{latencyLessons.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>

          <section className="stage">
            <h2>Availability: the nines</h2>
            <p className="hint">Providers promise uptime in nines. Pick one to see what it allows. Cloud SLAs usually start at three nines.</p>
            <div className="chips" role="group" aria-label="Availability level">
              {nines.map((x, i) => (<button key={x.label} className={i === n ? 'on' : ''} aria-pressed={i === n} onClick={() => setN(i)}>{x.label}</button>))}
            </div>
            <p className="nines-name">{nines[n].name}: downtime you are allowed</p>
            <div className="down">
              <div><b>{d.year}</b><span>per year</span></div>
              <div><b>{d.month}</b><span>per month</span></div>
              <div><b>{d.day}</b><span>per day</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
