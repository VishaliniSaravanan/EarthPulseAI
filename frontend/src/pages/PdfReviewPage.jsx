import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, FileSearch, GitBranch, Loader2 } from 'lucide-react'

const normalize = (text) => (text || '').replace(/\s+/g, ' ').trim()

function findPositions(text, phrase) {
  const needle = normalize(phrase).toLowerCase()
  if (needle.length < 12) return []
  const positions = []
  const lower = text.toLowerCase()
  let start = 0
  while (start < lower.length) {
    const index = lower.indexOf(needle, start)
    if (index < 0) break
    positions.push({ start: index, end: index + needle.length })
    start = index + needle.length
  }
  return positions
}

function getAnnotations(text, contradictions) {
  const entries = []
  contradictions.forEach((item, index) => {
    for (const [phrase, type] of [[item.claim, 'claim'], [item.evidence, 'evidence']]) {
      findPositions(text, phrase).forEach(({ start, end }) => entries.push({ start, end, type, index }))
    }
  })
  entries.sort((a, b) => a.start - b.start || a.end - b.end)
  return entries.filter((entry, index) => !entries.slice(0, index).some(previous => (
    entry.start < previous.end && entry.end > previous.start
  )))
}

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib)
  const source = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'
  return new Promise((resolve, reject) => {
    let script = document.querySelector(`script[src="${source}"]`)
    if (!script) {
      script = document.createElement('script')
      script.src = source
      script.async = true
      document.head.appendChild(script)
    }
    script.addEventListener('load', () => window.pdfjsLib ? resolve(window.pdfjsLib) : reject(new Error('PDF viewer could not start.')))
    script.addEventListener('error', () => reject(new Error('PDF viewer could not load. Check your internet connection.')))
  })
}

export default function PdfReviewPage({ data, pdfFileRef }) {
  const [pages, setPages] = useState([])
  const [pageNumber, setPageNumber] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const contradictions = data?.greenwashing?.contradictions || []

  useEffect(() => {
    let cancelled = false
    const file = pdfFileRef?.current
    if (!file) {
      if (data?._fullText) setPages(data._fullText.split(/\n{2,}/).filter(Boolean).map(text => normalize(text)))
      return () => { cancelled = true }
    }

    const load = async () => {
      setLoading(true)
      try {
        const pdfjs = await loadPdfJs()
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
        const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise
        const extracted = []
        for (let index = 1; index <= pdf.numPages; index++) {
          const page = await pdf.getPage(index)
          const content = await page.getTextContent()
          extracted.push(normalize(content.items.map(item => item.str || '').join(' ')))
        }
        if (!cancelled) {
          setPages(extracted)
          setPageNumber(1)
        }
      } catch (error) {
        if (cancelled) return
        console.warn('Using extracted report text for PDF review.', error)
        if (data?._fullText) {
          setPages(data._fullText.split(/\n{2,}/).filter(Boolean).map(text => normalize(text)))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [data, pdfFileRef])

  const pageText = pages[pageNumber - 1] || ''
  const annotations = useMemo(() => getAnnotations(pageText, contradictions), [pageText, contradictions])

  const navigateToContradiction = (item, index) => {
    setSelectedIndex(index)
    const phrase = normalize(item.claim || item.evidence).toLowerCase()
    const matchingPage = pages.findIndex(page => page.toLowerCase().includes(phrase.slice(0, 60)))
    if (matchingPage >= 0) setPageNumber(matchingPage + 1)
  }

  const highlightedText = () => {
    if (!annotations.length) return pageText
    const parts = []
    let cursor = 0
    annotations.forEach((annotation, index) => {
      if (annotation.start > cursor) parts.push(<span key={`text-${index}`}>{pageText.slice(cursor, annotation.start)}</span>)
      const selected = selectedIndex === annotation.index
      parts.push(
        <mark
          key={`mark-${index}`}
          className={`review-mark ${annotation.type} ${selected ? 'selected' : ''}`}
          onClick={() => setSelectedIndex(annotation.index)}
          title={annotation.type === 'claim' ? 'Contradicted claim' : 'Contradicting evidence'}
        >{pageText.slice(annotation.start, annotation.end)}</mark>,
      )
      cursor = annotation.end
    })
    if (cursor < pageText.length) parts.push(<span key="text-end">{pageText.slice(cursor)}</span>)
    return parts
  }

  if (!data) {
    return <div className="empty-panel"><FileSearch size={30} /><h2>No report to review</h2><p>Upload a PDF first to see its highlighted statements.</p></div>
  }

  return (
    <div className="review-layout fade-up">
      <section className="review-document card">
        <div className="review-toolbar">
          <div className="review-title"><FileSearch size={17} /><div><strong>PDF text review</strong><small>{data.file_name || data.company}</small></div></div>
          <div className="page-controls">
            <button className="icon-button" disabled={pageNumber <= 1} onClick={() => setPageNumber(number => number - 1)} aria-label="Previous page"><ArrowLeft size={15} /></button>
            <span>{pageNumber} / {Math.max(pages.length, 1)}</span>
            <button className="icon-button" disabled={pageNumber >= pages.length} onClick={() => setPageNumber(number => number + 1)} aria-label="Next page"><ArrowRight size={15} /></button>
          </div>
        </div>
        <div className="document-content">
          {loading ? (
            <div className="document-state"><Loader2 className="spin" size={22} /> Reading PDF text…</div>
          ) : pageText ? (
            <>
              <div className="highlight-legend"><span className="legend-claim" /> Report claim <span className="legend-evidence" /> Contradicting evidence</div>
              <article className="paper-text">{highlightedText()}</article>
            </>
          ) : (
            <div className="document-state">No report text could be displayed.</div>
          )}
        </div>
      </section>

      <aside className="contradiction-panel card">
        <div className="panel-heading">
          <span className="panel-icon"><GitBranch size={16} /></span>
          <div><h2>Contradictions</h2><p>{contradictions.length} matched pairs</p></div>
        </div>
        <div className="contradiction-list">
          {contradictions.length === 0 ? (
            <div className="no-contradictions">No contradictions were detected in this report.</div>
          ) : contradictions.map((item, index) => (
            <button
              key={`${index}-${item.claim}`}
              className={`contradiction-card ${selectedIndex === index ? 'selected' : ''}`}
              onClick={() => navigateToContradiction(item, index)}
            >
              <span className="contradiction-number">PAIR {String(index + 1).padStart(2, '0')}</span>
              <span className="statement-label claim-label">CLAIM</span>
              <span className="statement-text">{item.claim}</span>
              <span className="statement-label evidence-label">CONTRADICTING LINE</span>
              <span className="statement-text">{item.evidence}</span>
              <span className={`severity severity-${item.severity || 'medium'}`}>{item.severity || 'medium'} confidence</span>
            </button>
          ))}
        </div>
      </aside>
    </div>
  )
}
