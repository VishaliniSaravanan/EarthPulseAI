import { useRef, useState } from 'react'
import { AlertCircle, ArrowRight, CheckCircle2, FileText, Leaf, Upload, X } from 'lucide-react'
import { analyzeESG } from '../utils/api'
import { Spinner } from '../components/ui'

const MAX_FILE_SIZE = 50 * 1024 * 1024

export default function UploadPage({ onAnalyzed }) {
  const [file, setFile] = useState(null)
  const [company, setCompany] = useState('')
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const chooseFile = (selected) => {
    if (!selected) return
    setError('')
    if (!selected.name.toLowerCase().endsWith('.pdf')) {
      setFile(null)
      setError('Please choose a PDF file.')
      return
    }
    if (selected.size > MAX_FILE_SIZE) {
      setFile(null)
      setError('This PDF is larger than the 50 MB limit.')
      return
    }
    setFile(selected)
    setCompany(selected.name.replace(/\.pdf$/i, '').replace(/[_-]+/g, ' '))
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    chooseFile(event.dataTransfer.files[0])
  }

  const handleAnalyze = async (event) => {
    event.preventDefault()
    if (!file || !company.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const result = await analyzeESG(file, company.trim())
      onAnalyzed(result, file)
    } catch (requestError) {
      setError(requestError.message || 'Analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="upload-layout fade-up">
      <div className="upload-intro">
        <span className="eyebrow"><Leaf size={14} /> SUSTAINABILITY REPORT ANALYSIS</span>
        <h2>Clarity from every page.</h2>
        <p>Upload a PDF to extract ESG metrics, highlight claims and evidence, and map contradictions.</p>
        <div className="workflow-list">
          <div><span>01</span><strong>Upload a report</strong><small>PDF · up to 50 MB</small></div>
          <div><span>02</span><strong>Review the evidence</strong><small>Highlighted statements</small></div>
          <div><span>03</span><strong>Explore the insights</strong><small>Metrics and contradiction graph</small></div>
        </div>
      </div>

      <form className="upload-card card" onSubmit={handleAnalyze}>
        <div className="upload-card-heading">
          <div className="upload-icon"><Upload size={20} /></div>
          <div>
            <h3>Upload your report</h3>
            <p>Your document stays in this analysis session.</p>
          </div>
        </div>

        <button
          type="button"
          className={`drop-zone ${dragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={event => { event.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={event => {
              chooseFile(event.target.files[0])
              event.target.value = ''
            }}
          />
          {file ? (
            <span className="selected-file">
              <FileText size={22} />
              <span><strong>{file.name}</strong><small>{(file.size / 1024 / 1024).toFixed(2)} MB · PDF</small></span>
              <span
                role="button"
                tabIndex={0}
                className="remove-file"
                aria-label="Remove PDF"
                onClick={event => { event.stopPropagation(); setFile(null); setCompany('') }}
                onKeyDown={event => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    event.stopPropagation()
                    setFile(null)
                    setCompany('')
                  }
                }}
              ><X size={16} /></span>
            </span>
          ) : (
            <span className="drop-prompt">
              <span className="drop-icon"><Upload size={21} /></span>
              <strong>Drop your PDF here</strong>
              <small>or browse files on your device</small>
              <span className="file-format">PDF ONLY · MAX 50 MB</span>
            </span>
          )}
        </button>

        <label className="field-label" htmlFor="company-name">Company or report name</label>
        <input
          id="company-name"
          className="company-input"
          value={company}
          onChange={event => setCompany(event.target.value)}
          placeholder="e.g. Annual Sustainability Report"
          required
        />

        {error && <div className="form-error"><AlertCircle size={16} />{error}</div>}

        <button className="btn btn-primary analyze-button" type="submit" disabled={!file || !company.trim() || loading}>
          {loading ? <><Spinner size={16} /> Analyzing report…</> : <>Analyze report <ArrowRight size={16} /></>}
        </button>
        <div className="privacy-note"><CheckCircle2 size={14} /> No external AI service or account required</div>
      </form>
    </div>
  )
}
