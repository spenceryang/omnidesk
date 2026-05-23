import React, { useState, useEffect } from 'react';
import { GitBranch, GitCommit, Split, ArrowRight, HelpCircle, Activity, Check } from 'lucide-react';
import { MOCK_AGENT_LOGS } from '../mockData';

export default function RemixPanel({ project, activeBranch, onApplyRemix, onSwitchBranch }) {
  const [remixPrompt, setRemixPrompt] = useState('');
  const [isRemixing, setIsRemixing] = useState(false);
  const [remixLogs, setRemixLogs] = useState([]);
  const [compareBranchId, setCompareBranchId] = useState('');
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Simulated Remix Agent compilation logs
  useEffect(() => {
    if (isRemixing) {
      setRemixLogs([]);
      let currentIdx = 0;
      const interval = setInterval(() => {
        if (currentIdx < MOCK_AGENT_LOGS.remixRun.length) {
          setRemixLogs(prev => [...prev, MOCK_AGENT_LOGS.remixRun[currentIdx]]);
          currentIdx++;
        } else {
          clearInterval(interval);
          setIsRemixing(false);
          onApplyRemix(remixPrompt);
          setRemixPrompt('');
        }
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isRemixing]);

  const handleSubmitRemix = (e) => {
    e.preventDefault();
    if (!remixPrompt.trim() || isRemixing) return;
    setIsRemixing(true);
  };

  const branches = Object.values(project.branches || {});

  // Diffs renderer helper
  const renderTextDiff = (original, modified) => {
    if (original === modified) {
      return <span style={{ color: 'var(--text-muted)' }}>{original}</span>;
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ textDecoration: 'line-through', color: '#f43f5e', background: 'rgba(244,63,94,0.1)', padding: '2px 4px', borderRadius: '4px' }}>
          - {original}
        </div>
        <div style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 4px', borderRadius: '4px' }}>
          + {modified}
        </div>
      </div>
    );
  };

  const selectedCompareBranch = project.branches[compareBranchId];

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <GitBranch size={20} style={{ color: 'var(--neon-purple)' }} />
          Remix Branching Desk
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Every edit branches the project rather than overwriting it. Jump between versions fluidly.
        </p>
      </div>

      {/* Grid: Branch Tree & Remix Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
        
        {/* Left column: Version History Tree */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>PROJECT VERSION TREE</span>
          <div className="branch-tree-container" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {branches.map(branch => {
              const isActive = branch.id === activeBranch.id;
              const isBase = branch.parentId === null;

              return (
                <div 
                  key={branch.id} 
                  className={`branch-node ${isActive ? 'active' : ''}`}
                  onClick={() => onSwitchBranch(branch.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <GitCommit size={14} style={{ color: isActive ? 'var(--neon-purple)' : 'var(--text-muted)' }} />
                      {!isBase && <div style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)', margin: '2px 0' }} />}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{branch.name}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>{branch.timestamp}</span>
                    </div>
                  </div>
                  <span className="badge badge-purple" style={{ fontSize: '0.6rem' }}>
                    {branch.originalityScore}% Score
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Quick instructions */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dark)', display: 'flex', gap: '4px', alignItems: 'center' }}>
            <HelpCircle size={12} />
            <span>Click any node to activate workspace state.</span>
          </div>
        </div>

        {/* Right column: Natural Language Command Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>NL REMIX CONTROL</span>
          
          <form onSubmit={handleSubmitRemix} style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="studio-input"
              disabled={isRemixing}
              placeholder="e.g. Change setting to a rain-soaked rooftop..."
              value={remixPrompt}
              onChange={(e) => setRemixPrompt(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={!remixPrompt.trim() || isRemixing}
              style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Split size={16} />
            </button>
          </form>

          {/* Quick presets for remixing */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['Change setting to a rain-soaked rooftop', 'Make the chorus brighter with cyan lens flares', 'Apply vertical format for TikTok'].map((pst, pIdx) => (
              <button 
                key={pIdx}
                type="button"
                className="btn-secondary"
                disabled={isRemixing}
                onClick={() => setRemixPrompt(pst)}
                style={{ fontSize: '0.7rem', padding: '4px 8px' }}
              >
                {pst}
              </button>
            ))}
          </div>

          {/* Remixing progress logs */}
          {isRemixing && (
            <div className="terminal-container" style={{ maxHeight: '150px', padding: '10px' }}>
              <div style={{ color: 'var(--neon-purple)', fontWeight: 'bold', fontSize: '0.75rem', marginBottom: '6px' }}>
                REMIX AGENT DEMO REPLAY...
              </div>
              {remixLogs.map((log, idx) => (
                <div key={idx} style={{ fontSize: '0.75rem', marginBottom: '2px' }}>
                  <span className="log-time">[{log.time}]</span>{' '}
                  <span className="log-agent">{log.agent}:</span>{' '}
                  <span style={{ color: 'var(--text-main)' }}>{log.msg}</span>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      {/* Compare Mode Side Drawer */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={16} style={{ color: 'var(--neon-cyan)' }} />
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Branch Diff Inspector (Compare Mode)</h4>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select 
              className="studio-select" 
              style={{ padding: '4px 8px', fontSize: '0.75rem', width: '180px' }}
              value={compareBranchId}
              onChange={(e) => setCompareBranchId(e.target.value)}
            >
              <option value="">Select branch to compare...</option>
              {branches
                .filter(b => b.id !== activeBranch.id)
                .map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))
              }
            </select>
            <button 
              className="btn-secondary" 
              onClick={() => setIsCompareOpen(!isCompareOpen)} 
              disabled={!compareBranchId}
              style={{ padding: '4px 10px', fontSize: '0.75rem' }}
            >
              {isCompareOpen ? 'Hide Diffs' : 'Compare'}
            </button>
          </div>
        </div>

        {isCompareOpen && selectedCompareBranch && (
          <div className="compare-grid">
            
            {/* Column 1: Selected Compare Branch */}
            <div>
              <div className="compare-column-title" style={{ color: 'var(--text-muted)' }}>
                <GitCommit size={14} />
                <span>{selectedCompareBranch.name} (Originality: {selectedCompareBranch.originalityScore}%)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedCompareBranch.scenes.map((s, idx) => (
                  <div key={s.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem' }}>
                    <div style={{ fontWeight: 700, color: 'var(--neon-cyan)', marginBottom: '4px' }}>Scene {idx + 1} Prompt</div>
                    <p style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>{s.prompt}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 2: Active Branch (Current Workspace) */}
            <div>
              <div className="compare-column-title" style={{ color: 'var(--neon-purple)' }}>
                <GitBranch size={14} />
                <span>{activeBranch.name} (Originality: {activeBranch.originalityScore}%)</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeBranch.scenes.map((s, idx) => {
                  const compareScene = selectedCompareBranch.scenes[idx];
                  return (
                    <div key={s.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--neon-purple)', marginBottom: '4px' }}>Scene {idx + 1} Prompt Diff</div>
                      {compareScene ? renderTextDiff(compareScene.prompt, s.prompt) : <p>{s.prompt}</p>}
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
}
