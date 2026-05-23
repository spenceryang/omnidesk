import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Disc, Activity, AlertCircle, Play, ChevronRight, Zap } from 'lucide-react';
import { MOCK_AGENT_LOGS } from '../mockData';

const AGENTS = [
  { id: 'Audio Analyst', icon: '🎵', name: 'Music Analyst' },
  { id: 'Creator DNA', icon: '🧬', name: 'Creator DNA' },
  { id: 'IP Safety', icon: '🛡️', name: 'IP Safety Agent' },
  { id: 'Creative Director', icon: '🎨', name: 'Creative Director' },
  { id: 'Scene Planner', icon: '📅', name: 'Scene Planner' },
  { id: 'Continuity', icon: '🔄', name: 'Continuity Agent' },
  { id: 'Prompt Engineer', icon: '⚙️', name: 'Prompt Engineer' },
  { id: 'Generation Router', icon: '🚀', name: 'Router Agent' }
];

export default function AgentDesk({ isFlagged, onCompilationComplete }) {
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [activeAgent, setActiveAgent] = useState('');
  const [isCompiling, setIsCompiling] = useState(true);
  const terminalEndRef = useRef(null);

  // Load the appropriate log set
  const logSequence = isFlagged 
    ? [...MOCK_AGENT_LOGS.initialRun.slice(0, 5), ...MOCK_AGENT_LOGS.ipSafetyFlagged, ...MOCK_AGENT_LOGS.initialRun.slice(7)]
    : MOCK_AGENT_LOGS.initialRun;

  useEffect(() => {
    let currentLogIndex = 0;
    setLogs([]);
    setProgress(0);
    setIsCompiling(true);

    const interval = setInterval(() => {
      if (currentLogIndex < logSequence.length) {
        const nextLog = logSequence[currentLogIndex];
        setLogs(prev => [...prev, nextLog]);
        setActiveAgent(nextLog.agent);
        setProgress(Math.round(((currentLogIndex + 1) / logSequence.length) * 100));
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setIsCompiling(false);
        setActiveAgent('');
      }
    }, 1500); // Add a log line every 1.5 seconds

    return () => clearInterval(interval);
  }, [isFlagged]);

  // Scroll to bottom on new logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const handleSkip = () => {
    setLogs(logSequence);
    setProgress(100);
    setIsCompiling(false);
    setActiveAgent('');
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={20} style={{ color: 'var(--neon-cyan)' }} />
            Simulated Agentic Production Desk
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Demo playback of the managed-agent workflow. These logs are cached locally until Gemini 3.5 Flash and Managed Agents are wired.
          </p>
        </div>
        {isCompiling && (
          <button className="btn-secondary" onClick={handleSkip} style={{ fontSize: '0.75rem', padding: '6px 12px' }}>
            <Zap size={14} style={{ color: 'var(--neon-amber)' }} /> Fast-Compile
          </button>
        )}
      </div>

      {/* Agents Bubble Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {AGENTS.map(agent => {
          const isActive = activeAgent === agent.id;
          const isDone = logs.some(log => log.agent === agent.id) && !isActive;

          return (
            <div 
              key={agent.id}
              className={`glass-card ${isActive ? 'pulse-agent' : ''}`}
              style={{
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: isActive ? '1px solid var(--neon-purple)' : isDone ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-subtle)',
                background: isActive ? 'rgba(139, 92, 246, 0.08)' : isDone ? 'rgba(16, 185, 129, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                transition: 'all 0.3s ease'
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>{agent.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isActive ? 'var(--neon-purple)' : 'var(--text-main)' }}>
                  {agent.name}
                </span>
                <span style={{ fontSize: '0.65rem', color: isActive ? 'var(--neon-cyan)' : isDone ? 'var(--neon-green)' : 'var(--text-dark)' }}>
                  {isActive ? '● Processing...' : isDone ? '✓ Finished' : 'Idle'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', background: 'rgba(255,255,255,0.05)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            width: `${progress}%`, 
            background: 'linear-gradient(90deg, var(--neon-purple) 0%, var(--neon-cyan) 100%)', 
            transition: 'width 0.4s ease-out',
            boxShadow: '0 0 8px var(--neon-cyan-glow)' 
          }} 
        />
      </div>

      {/* Terminal logs */}
      <div className="terminal-container">
        <div className="terminal-header">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="terminal-dot dot-red"></span>
            <span className="terminal-dot dot-yellow"></span>
            <span className="terminal-dot dot-green"></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>cached-agent-run.json</span>
          </div>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Terminal size={12} />
            <span>DEMO MODE</span>
          </span>
        </div>

        <div>
          {logs.map((log, idx) => (
            <div key={idx} className="log-line">
              <span className="log-time">[{log.time}]</span>
              <span className="log-agent">{log.agent}:</span>
              <span style={{ color: log.msg.includes('WARNING') ? 'var(--neon-rose)' : log.msg.includes('Flagging') ? 'var(--neon-rose)' : 'var(--text-main)' }}>
                {log.msg}
              </span>
            </div>
          ))}
          {isCompiling && (
            <div className="log-line" style={{ color: 'var(--text-dark)' }}>
            <span>_ replaying cached agent event stream</span>
              <span className="wave-bar" style={{ display: 'inline-block', width: '2px', height: '10px', marginLeft: '4px', verticalAlign: 'middle', animation: 'waveMove 1s infinite' }}></span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Navigation action */}
      {!isCompiling && (
        <button 
          className="btn-primary" 
          onClick={onCompilationComplete}
          style={{ alignSelf: 'flex-end', animation: 'pulseGlow 2s infinite ease-in-out' }}
        >
          <span>Review Demo Storyboard</span>
          <ChevronRight size={16} />
        </button>
      )}

    </div>
  );
}
