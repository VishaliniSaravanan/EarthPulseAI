import { BarChart3, Droplets, Factory, Leaf, Recycle, Users, Waves, Wind } from 'lucide-react'

const formatNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const METRICS = [
  { key: 'scope1', label: 'Scope 1 emissions', unit: 'tCO₂e', icon: Factory, color: 'green' },
  { key: 'scope2', label: 'Scope 2 emissions', unit: 'tCO₂e', icon: Wind, color: 'blue' },
  { key: 'scope3', label: 'Scope 3 emissions', unit: 'tCO₂e', icon: Waves, color: 'purple' },
  { key: 'renewable_pct', label: 'Renewable energy', unit: '%', icon: Leaf, color: 'green' },
  { key: 'water_usage', label: 'Water usage', unit: 'reported', icon: Droplets, color: 'blue' },
  { key: 'waste', label: 'Waste', unit: 'reported', icon: Recycle, color: 'orange' },
  { key: 'employees', label: 'Employees', unit: 'people', icon: Users, color: 'purple' },
  { key: 'energy_consumption', label: 'Energy use', unit: 'reported', icon: BarChart3, color: 'orange' },
]

function ScoreRow({ label, score, color }) {
  const value = Number(score) || 0
  return (
    <div className="score-row">
      <div className="score-row-label"><span>{label}</span><strong>{value.toFixed(0)}</strong></div>
      <div className="score-track"><span className={color} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} /></div>
    </div>
  )
}

export default function MetricsPage({ data }) {
  if (!data) {
    return <div className="empty-panel"><BarChart3 size={30} /><h2>Your metrics will appear here</h2><p>Upload a sustainability report to begin.</p></div>
  }

  const metrics = data.metrics || {}
  const scores = metrics.esg_scores || {}
  const score = Number(scores.composite) || 0

  return (
    <div className="metrics-page fade-up">
      <section className="score-overview card">
        <div className="score-copy">
          <span className="eyebrow">REPORT SNAPSHOT</span>
          <h2>{data.company}</h2>
          <p>Extracted from {data.page_count} PDF pages. Values are shown only when found in the report.</p>
        </div>
        <div className="composite-score">
          <div className="score-circle" style={{ '--score': `${score}%` }}><strong>{score.toFixed(0)}</strong><small>/ 100</small></div>
          <span>Estimated ESG score</span>
        </div>
      </section>

      <div className="section-heading">
        <div><h2>Reported indicators</h2><p>Metrics detected in the document</p></div>
        <span className="data-source"><span /> Extracted from PDF</span>
      </div>

      <section className="metric-grid">
        {METRICS.map(({ key, label, unit, icon: Icon, color }) => (
          <article className="metric-card card" key={key}>
            <span className={`metric-icon ${color}`}><Icon size={17} /></span>
            <span className="metric-card-label">{label}</span>
            <strong className="metric-card-value">{formatNumber(metrics[key])}</strong>
            <small>{unit}</small>
          </article>
        ))}
      </section>

      <section className="score-breakdown card">
        <div className="section-heading">
          <div><h2>ESG score breakdown</h2><p>Directional scores based on available report indicators</p></div>
          <span className="score-badge">{scores.rating || '—'}</span>
        </div>
        <div className="score-rows">
          <ScoreRow label="Environmental" score={scores.environmental} color="green" />
          <ScoreRow label="Social" score={scores.social} color="blue" />
          <ScoreRow label="Governance" score={scores.governance} color="purple" />
        </div>
        <p className="score-disclaimer">These automated scores are indicative, not a certified ESG rating.</p>
      </section>
    </div>
  )
}
