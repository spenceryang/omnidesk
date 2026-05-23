import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react';
import { MOCK_IP_SAFETY_TESTS } from '../mockData';

// Keywords to trigger the safety agent
const IP_RULES = [
  { keywords: ['disney', 'pixar'], replacement: 'whimsical high-contrast cell-shaded 3D animation', label: 'Disney/Pixar Style Trademark' },
  { keywords: ['fortnite', 'minecraft'], replacement: 'futuristic tactical outfits with colorful neon piping and blocky retro-digital accents', label: 'Game Publisher IP' },
  { keywords: ['marvel', 'spider-man', 'spiderman', 'avengers'], replacement: 'sleek athletic exoskeleton, spider-web-like digital wireframes, cinematic vigilante look', label: 'Marvel Superhero IP' },
  { keywords: ['billie eilish', 'travis scott', 'drake'], replacement: 'moody dark indie vocal elements and loose oversized silhouette streetwear styling', label: 'Copyrighted Artist Persona' },
  { keywords: ['star wars', 'lightsaber'], replacement: 'original laser-sword glowing bars and planetary desert space-colony architecture', label: 'Lucasfilm IP' }
];

export default function BriefInput({ project, onStartProduction }) {
  const [brief, setBrief] = useState(project.brief || '');
  const [ipFlags, setIpFlags] = useState([]);
  const [rewrittenBrief, setRewrittenBrief] = useState('');
  const [rewriteReason, setRewriteReason] = useState('');
  const [isSafe, setIsSafe] = useState(true);

  // Run safety check on input change
  useEffect(() => {
    if (!brief.trim()) {
      setIpFlags([]);
      setRewrittenBrief('');
      setRewriteReason('');
      setIsSafe(true);
      return;
    }

    const lowercaseBrief = brief.toLowerCase();
    const flags = [];
    let rewritten = brief;
    let explanations = [];

    IP_RULES.forEach(rule => {
      const detected = rule.keywords.filter(kw => lowercaseBrief.includes(kw));
      if (detected.length > 0) {
        flags.push({ ruleLabel: rule.label, matched: detected });
        // Replace in rewritten prompt
        detected.forEach(kw => {
          const regex = new RegExp(kw, 'gi');
          rewritten = rewritten.replace(regex, `[${rule.replacement}]`);
        });
        explanations.push(`Replaced copyrighted elements "${detected.join(', ')}" with original descriptive styling to prevent trademark conflicts.`);
      }
    });

    setIpFlags(flags);
    setRewrittenBrief(rewritten);
    setRewriteReason(explanations.join(' '));
    setIsSafe(flags.length === 0);

  }, [brief]);

  const loadPreset = (text) => {
    setBrief(text);
  };

  const handleStart = () => {
    onStartProduction(brief, rewrittenBrief, isSafe, ipFlags);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={20} style={{ color: 'var(--neon-purple)' }} />
          Creative Director & IP Safety Brief
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          State your video concept in natural language. The IP Safety Agent will check and clean any copyrighted references.
        </p>
      </div>

      {/* Suggested Prompts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-dark)', fontWeight: 600 }}>TRY A PRESET BRIEF:</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => loadPreset("original neon space-western dance video in a train station, cinematic, lonely but high energy.")}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            🌌 Space Western (Safe)
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => loadPreset("Make it look like a Disney animation with Fortnite character skins.")}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            🏰 Disney & Fortnite (IP Warning)
          </button>
          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => loadPreset("A gritty Cyberpunk street dancer similar to Marvel's Spider-man in Neo-Tokyo.")}
            style={{ fontSize: '0.75rem', padding: '6px 12px' }}
          >
            🕷️ Marvel & Spider-Man (IP Warning)
          </button>
        </div>
      </div>

      {/* Text Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label style={{ fontWeight: 600, fontSize: '0.85rem' }}>Write your brief here:</label>
        <textarea
          className="studio-textarea"
          rows={4}
          placeholder="Describe settings, movements, cameras, and mood (e.g. 'A dancer moving through a wet alleyway, low camera sweeping, high-contrast violet headlights...')"
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          style={{ fontSize: '0.95rem', resize: 'vertical' }}
        />
      </div>

      {/* Real-time IP Safety Agent Response */}
      {brief.trim() && (
        <div style={{
          background: isSafe ? 'rgba(16, 185, 129, 0.05)' : 'rgba(245, 158, 11, 0.05)',
          border: '1px solid',
          borderColor: isSafe ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}>
          {/* Header Status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isSafe ? (
                <CheckCircle size={18} style={{ color: 'var(--neon-green)' }} />
              ) : (
                <AlertTriangle size={18} style={{ color: 'var(--neon-amber)' }} />
              )}
              <span style={{ fontWeight: 700, fontSize: '0.9rem', color: isSafe ? 'var(--neon-green)' : 'var(--neon-amber)' }}>
                IP Safety Screen: {isSafe ? 'No Banned Elements Detected' : 'Trademark / IP Warning Flagged'}
              </span>
            </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              LOCAL RULE SET: IP-SAFETY-v1.4
            </span>
          </div>

          {/* If Flagged details */}
          {!isSafe && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ipFlags.map((flag, idx) => (
                  <span key={idx} className="badge badge-amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    ⚠️ {flag.ruleLabel} ({flag.matched.join(', ')})
                  </span>
                ))}
              </div>
              
              <div style={{ borderLeft: '3px solid var(--neon-amber)', paddingLeft: '12px', margin: '4px 0' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '2px' }}>Aesthetic Rewrite Strategy:</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>{rewriteReason}</div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--neon-cyan)', fontWeight: 600, marginBottom: '6px', fontSize: '0.8rem' }}>
                  <Shield size={14} />
                  <span>IP-SAFE ORIGINAL DESIGN BRIEF PROPOSAL:</span>
                </div>
                <p style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: '1.4' }}>
                  {rewrittenBrief}
                </p>
              </div>
            </div>
          )}

          {isSafe && (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Your brief avoids the local blocklist. The live Gemini safety agent is not connected yet; this is a frontend-only preflight.
            </p>
          )}
        </div>
      )}

      {/* CTA Button */}
      <button 
        type="button" 
        className="btn-primary" 
        disabled={!brief.trim()}
        onClick={handleStart}
        style={{
          alignSelf: 'flex-end',
          opacity: brief.trim() ? 1 : 0.5,
          cursor: brief.trim() ? 'pointer' : 'not-allowed',
        }}
      >
        <span>Compile production brief</span>
        <ArrowRight size={16} />
      </button>

    </div>
  );
}
