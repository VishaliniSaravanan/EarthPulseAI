import { useMemo, useState } from 'react'
import { GitBranch, Info } from 'lucide-react'
import { ForceGraph } from '../components/ui'

export default function GraphsPage({ data }) {
  const [selectedNode, setSelectedNode] = useState(null)
  const graph = data?.graph || {}
  const contradictions = data?.greenwashing?.contradictions || []
  const graphData = useMemo(() => {
    const edges = (graph.edges || []).filter(edge => edge.relation === 'contradicts')
    const connected = new Set(edges.flatMap(edge => [edge.source, edge.target]))
    return {
      edges,
      nodes: (graph.nodes || []).filter(node => connected.has(node.id)),
    }
  }, [graph])

  if (!data) {
    return <div className="empty-panel"><GitBranch size={30} /><h2>No report graph yet</h2><p>Upload a report to map detected contradictions.</p></div>
  }

  return (
    <div className="graph-page fade-up">
      <section className="graph-intro">
        <div><span className="eyebrow">CLAIMS ↔ EVIDENCE</span><h2>Contradiction map</h2><p>Each connection links a sustainability claim to a line of evidence that conflicts with it.</p></div>
        <div className="graph-count"><strong>{contradictions.length}</strong><span>matched pairs</span></div>
      </section>

      <section className="graph-card card">
        <div className="graph-legend">
          <span><i className="claim-dot" /> Claim</span>
          <span><i className="evidence-dot" /> Evidence</span>
          <span><i className="contradiction-line" /> Contradicts</span>
        </div>
        {graphData.nodes.length > 0 ? (
          <ForceGraph
            nodes={graphData.nodes.map(node => ({ ...node, label: node.label || node.full, full: node.full }))}
            edges={graphData.edges}
            colorFn={node => node.type === 'claim' ? '#dc6657' : '#557e59'}
            height={460}
            onNodeClick={setSelectedNode}
          />
        ) : (
          <div className="graph-empty"><GitBranch size={25} /><strong>No contradiction links found</strong><span>Detected claim and evidence pairs will appear here.</span></div>
        )}
        {selectedNode && (
          <div className="selected-node"><Info size={15} /><div><strong>{selectedNode.type === 'claim' ? 'Report claim' : 'Evidence line'}</strong><p>{selectedNode.full || selectedNode.label}</p></div></div>
        )}
      </section>
      <p className="graph-footnote">These automated matches are a review aid; verify each statement in its original context.</p>
    </div>
  )
}
