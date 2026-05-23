import React, { useState } from 'react';
import { Award, FileText, Download, ShieldCheck, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function ExportPanel({ project, activeBranch }) {
  const [exportConfig, setExportConfig] = useState({
    prompts: true,
    timeline: true,
    provenance: true,
    mockVideo: true
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const score = activeBranch ? activeBranch.originalityScore : 88;
  const breakdown = activeBranch ? activeBranch.originalityBreakdown : {
    userSource: 30,
    originalMotifs: 20,
    avoidedIP: 20,
    promptSpecificity: 10,
    continuity: 8
  };

  // SVG parameters for circle
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const handleToggleConfig = (key) => {
    setExportConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      
      // Create mock file download of project configuration package
      const exportData = {
        projectName: project.name,
        branchName: activeBranch.name,
        originalityScore: score,
        breakdown,
        scenes: activeBranch.scenes.map(s => ({
          id: s.id,
          timestamp: s.timestamp,
          prompt: s.prompt,
          description: s.description,
          safety: s.safetyStatus
        })),
        provenance: {
          license: 'Creator Owned - Omnidesk Verified License',
          ownerConsent: project.creatorDNA.rightsChecked,
          timestamp: new Date().toISOString()
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, '_')}_omnidesk_package.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      // Reset success state after a few seconds
      setTimeout(() => setExportComplete(false), 5000);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Originality Score Section */}
      <div className="glass-panel" style={{ textAlign: 'center' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Award size={18} style={{ color: 'var(--neon-purple)' }} />
          Originality Verification Score
        </h4>

        <div className="score-circle">
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeWidth}
            />
            {/* Score progress circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="transparent"
              stroke="url(#scoreGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--neon-purple)" />
                <stop offset="100%" stopColor="var(--neon-cyan)" />
              </linearGradient>
            </defs>
          </svg>
          
          <div className="score-value">
            <div className="score-number">{score}</div>
            <div className="score-label">Originality</div>
          </div>
        </div>

        {/* Score Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px', textAlign: 'left' }}>
          {[
            { label: 'User Owned DNA Assets', val: breakdown.userSource, max: 30, color: 'var(--neon-green)' },
            { label: 'Original Motif Mapping', val: breakdown.originalMotifs, max: 20, color: 'var(--neon-purple)' },
            { label: 'Protected IP Screenings (Clean)', val: breakdown.avoidedIP, max: 20, color: 'var(--neon-cyan)' },
            { label: 'Visual Prompt Specificity', val: breakdown.promptSpecificity, max: 15, color: 'var(--neon-rose)' },
            { label: 'Cross-Scene Continuity', val: breakdown.continuity, max: 15, color: 'var(--neon-amber)' }
          ].map((bar, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>{bar.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{bar.val} / {bar.max} pts</span>
              </div>
              <div style={{ width: '100%', background: 'rgba(0,0,0,0.3)', height: '4px', borderRadius: '2px' }}>
                <div style={{ width: `${(bar.val / bar.max) * 100}%`, height: '100%', background: bar.color, borderRadius: '2px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provenance Report Section */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} style={{ color: 'var(--neon-green)' }} />
          <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Provenance Registry Report</h4>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span>Project License:</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>Creator-Owned (Clear)</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span>Consent Registry:</span>
            <span style={{ color: 'var(--neon-green)', fontWeight: 600 }}>Verified Signatures</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span>Model Registry:</span>
            <span style={{ color: 'var(--text-main)' }}>Omnidesk-Diff-v4 (Local Host)</span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>DNA Connection Nodes:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
            <div>▪ audio_hash: sha256_82f1b74a...</div>
            <div>▪ dance_choreo: sha256_cc83921b...</div>
            <div>▪ outfit_refs: 3 unique nodes mapped</div>
          </div>
        </div>
      </div>

      {/* Export Configurations & Button */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>Export Configuration Bundle</h4>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { key: 'prompts', label: 'Prompt Pack (.txt)', desc: 'Optimized prompts for diffusion models' },
            { key: 'timeline', label: 'Timeline Config (.json)', desc: 'Structural cues, locks, and sections JSON' },
            { key: 'provenance', label: 'Provenance Report (.pdf)', desc: 'Rights checks and safety statement logs' },
            { key: 'mockVideo', label: 'Storyboard Preview Video (.mp4)', desc: 'Keyframe rendering sequence compilation' }
          ].map(opt => (
            <div 
              key={opt.key}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
              onClick={() => handleToggleConfig(opt.key)}
            >
              <div style={{ color: exportConfig[opt.key] ? 'var(--neon-purple)' : 'var(--text-dark)' }}>
                {exportConfig[opt.key] ? <Check size={16} style={{ strokeWidth: 3 }} /> : <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '3px' }} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: exportConfig[opt.key] ? 'var(--text-main)' : 'var(--text-muted)' }}>{opt.label}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>{opt.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {exportComplete && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-green)', fontSize: '0.8rem', background: 'rgba(16,185,129,0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(16,185,129,0.2)', marginTop: '4px' }}>
            <Sparkles size={16} />
            <span>Success! ZIP Bundle Exported. Check downloads.</span>
          </div>
        )}

        <button 
          onClick={handleExport}
          className="btn-primary" 
          disabled={isExporting || !Object.values(exportConfig).some(Boolean)}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          {isExporting ? (
            <span>Compiling Bundle...</span>
          ) : (
            <>
              <Download size={16} />
              <span>Export Production Package</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
