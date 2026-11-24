import { useEffect, useRef, useState } from 'react'
import { BarChart3, FileSearch, GitBranch, Leaf, Wifi, WifiOff } from 'lucide-react'
import { healthCheck } from './utils/api'
import GraphsPage from './pages/GraphsPage'
import LandingPage from './pages/LandingPage'
import MetricsPage from './pages/MetricsPage'
import PdfReviewPage from './pages/PdfReviewPage'
import UploadPage from './pages/UploadPage'

const NAV_ITEMS = [
  { id: 'upload', label: 'Upload report', icon: Leaf },
  { id: 'review', label: 'PDF review', icon: FileSearch },
  { id: 'metrics', label: 'ESG metrics', icon: BarChart3 },
  { id: 'graph', label: 'Contradiction graph', icon: GitBranch },
]

export default function App() {
  const [page, setPage] = useState('landing')
  const [analysis, setAnalysis] = useState(null)
  const [backendOnline, setBackendOnline] = useState(null)
  const pdfFileRef = useRef(null)

  useEffect(() => {
    healthCheck().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false))
  }, [])

  const handleAnalyzed = (result, file) => {
    pdfFileRef.current = file
    setAnalysis(result)
    setPage('metrics')
  }

  if (page === 'landing') return <LandingPage onStart={() => setPage('upload')} />

  const content = {
    upload: <UploadPage onAnalyzed={handleAnalyzed} />,
    review: <PdfReviewPage data={analysis} pdfFileRef={pdfFileRef} />,
    metrics: <MetricsPage data={analysis} />,
    graph: <GraphsPage data={analysis} />,
  }[page]

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <button className="brand-lockup" onClick={() => setPage('landing')} aria-label="EarthPulse AI home">
          <span className="brand-mark"><Leaf size={18} /></span>
          <span><strong>EarthPulse AI</strong><small>Report insights, made simple</small></span>
        </button>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="app-nav" aria-label="Main navigation">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
            const locked = id !== 'upload' && !analysis
            return (
              <button
                key={id}
                className={`nav-item ${page === id ? 'active' : ''}`}
                disabled={locked}
                onClick={() => setPage(id)}
              >
                <Icon size={17} /><span>{label}</span>
              </button>
            )
          })}
        </nav>
        <div className="sidebar-footer">
          {backendOnline === null ? (
            <span className="backend-status">Checking analysis service…</span>
          ) : backendOnline ? (
            <span className="backend-status online"><Wifi size={14} /> Analysis service ready</span>
          ) : (
            <span className="backend-status offline"><WifiOff size={14} /> Analysis service offline</span>
          )}
          {analysis && (
            <div className="active-report">
              <span className="sidebar-caption">CURRENT REPORT</span>
              <strong title={analysis.company}>{analysis.company}</strong>
              <small>{analysis.page_count} pages</small>
            </div>
          )}
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <span className="topbar-eyebrow">EARTHPULSE / {NAV_ITEMS.find(item => item.id === page)?.label.toUpperCase()}</span>
            <h1>{analysis?.company && page !== 'upload' ? analysis.company : NAV_ITEMS.find(item => item.id === page)?.label}</h1>
          </div>
          {analysis && page !== 'upload' && (
            <button className="btn btn-secondary" onClick={() => setPage('upload')}>Analyze another PDF</button>
          )}
        </header>
        <section className="page-content">{content}</section>
      </main>
    </div>
  )
}
