import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Lock, Unlock, Shield, Eye, Settings, Video } from 'lucide-react';

// Draw abstract keyframes dynamically on canvas to represent scenes
function SceneCanvas({ scene, isHovered }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    // Background gradient based on scene data
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, scene.colorStart || '#1e1b4b');
    grad.addColorStop(1, scene.colorEnd || '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Draw grid overlay
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < w; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw abstract geometry based on graphics type
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.strokeStyle = scene.colorStart || '#fff';
    ctx.lineWidth = 2;

    if (scene.graphics === 'platform') {
      // Draw railroad platform & fog
      ctx.fillStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, h - 20);
      ctx.lineTo(w, h - 35);
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();

      // Fog waves
      ctx.fillStyle = 'rgba(139, 92, 246, 0.3)';
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 15, w / 2, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Silhouette cowboy
      ctx.fillStyle = '#020617';
      ctx.fillRect(w / 2 - 10, h - 70, 20, 45); // Body
      ctx.beginPath();
      ctx.arc(w / 2, h - 75, 7, 0, Math.PI * 2); // Head
      ctx.fill();
      // Hat rim
      ctx.fillRect(w / 2 - 15, h - 78, 30, 3);
    } 
    else if (scene.graphics === 'spurs') {
      // Glow spur circles
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Spur spokes
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2);
        ctx.lineTo(w / 2 + Math.cos(angle) * 40, h / 2 + Math.sin(angle) * 40);
        ctx.stroke();
      }
    } 
    else if (scene.graphics === 'dance') {
      // Moving wireframe dancer
      ctx.strokeStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 12;
      ctx.lineWidth = 3;

      // Head
      ctx.beginPath();
      ctx.arc(w / 2, 35, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Spine
      ctx.beginPath();
      ctx.moveTo(w / 2, 43);
      ctx.lineTo(w / 2, 75);
      ctx.stroke();

      // Arms (in popping pose)
      ctx.beginPath();
      ctx.moveTo(w / 2 - 35, 48);
      ctx.lineTo(w / 2, 50);
      ctx.lineTo(w / 2 + 35, 60);
      ctx.stroke();

      // Legs
      ctx.beginPath();
      ctx.moveTo(w / 2, 75);
      ctx.lineTo(w / 2 - 20, 110);
      ctx.moveTo(w / 2, 75);
      ctx.lineTo(w / 2 + 20, 110);
      ctx.stroke();
    } 
    else if (scene.graphics === 'walk') {
      // Sunset orange sky
      const sunGrad = ctx.createRadialGradient(w / 2, h, 10, w / 2, h, 60);
      sunGrad.addColorStop(0, '#f59e0b');
      sunGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(w / 2, h, 60, 0, Math.PI, true);
      ctx.fill();

      // Tracks fading into horizon
      ctx.strokeStyle = '#475569';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 5, h / 2 + 10);
      ctx.lineTo(w / 2 - 40, h);
      ctx.moveTo(w / 2 + 5, h / 2 + 10);
      ctx.lineTo(w / 2 + 40, h);
      ctx.stroke();

      // Silhouetted walker
      ctx.fillStyle = '#090d16';
      ctx.fillRect(w / 2 - 6, h - 45, 12, 30);
      ctx.beginPath();
      ctx.arc(w / 2, h - 49, 4, 0, Math.PI * 2);
      ctx.fill();
    } 
    else if (scene.graphics === 'grid') {
      // Horizontal laser grids
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, 50 + i * 25);
        ctx.lineTo(w, 50 + i * 25);
        ctx.stroke();
      }
    } 
    else if (scene.graphics === 'hands') {
      // Tutting geometric wireframes
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(w / 2 - 30, h / 2 - 30, 60, 60);
      ctx.strokeStyle = '#06b6d4';
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 42, 0, Math.PI * 2);
      ctx.stroke();
    } 
    else if (scene.graphics === 'static') {
      // Analog noise
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      for (let i = 0; i < 800; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        ctx.fillRect(rx, ry, 2, 2);
      }
      ctx.fillStyle = '#3b82f6';
      ctx.font = '10px monospace';
      ctx.fillText('SIGNAL FAILURE', 10, 20);
    }
    else {
      // Fallback abstract waves
      ctx.strokeStyle = '#8b5cf6';
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      for (let x = 0; x < w; x++) {
        ctx.lineTo(x, h / 2 + Math.sin(x * 0.05) * 15);
      }
      ctx.stroke();
    }

    // Overlay Lock Status Indicators (Watermark style)
    const activeLocks = Object.entries(scene.locked || {})
      .filter(([_, isLocked]) => isLocked)
      .map(([key]) => key.toUpperCase());

    if (activeLocks.length > 0) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
      ctx.fillRect(4, h - 22, w - 8, 18);
      ctx.fillStyle = '#f59e0b';
      ctx.font = '7px sans-serif';
      ctx.fillText(`🔒 LOCKED: ${activeLocks.join(', ')}`, 8, h - 10);
    }

    // Hover overlay play button
    if (isHovered) {
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(w / 2 - 8, h / 2 - 10);
      ctx.lineTo(w / 2 + 10, h / 2);
      ctx.lineTo(w / 2 - 8, h / 2 + 10);
      ctx.closePath();
      ctx.fill();
    }

  }, [scene, isHovered]);

  return (
    <canvas 
      ref={canvasRef} 
      width={240} 
      height={140} 
      className="scene-canvas"
    />
  );
}

export default function Timeline({ project, activeBranch, onToggleSceneLock }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0); // 0 to 100%
  const [hoveredSceneId, setHoveredSceneId] = useState(null);
  const [selectedScene, setSelectedScene] = useState(null);
  const playIntervalRef = useRef(null);

  const durationSec = project.length.includes('s') ? parseInt(project.length) : 30;
  const scenes = activeBranch ? activeBranch.scenes : [];

  // Handle Play/Pause timer simulation
  useEffect(() => {
    if (isPlaying) {
      const startTime = Date.now() - (playhead / 100) * durationSec * 1000;
      playIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        let pct = (elapsed / (durationSec * 1000)) * 100;
        if (pct >= 100) {
          pct = 0; // Loop
        }
        setPlayhead(pct);
      }, 100);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying]);

  // Determine current active scene based on playhead percentage
  const currentSceneIndex = Math.min(
    Math.floor((playhead / 100) * scenes.length),
    scenes.length - 1
  );
  const activeSceneId = scenes[currentSceneIndex]?.id;

  const handlePlayToggle = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTimelineScrub = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    setPlayhead(percentage);
  };

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      
      {/* Waveform Scrubber Player */}
      <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
          <button 
            onClick={handlePlayToggle} 
            className="btn-primary" 
            style={{ width: '40px', height: '40px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center' }}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span style={{ fontWeight: 600, color: 'var(--neon-cyan)' }}>Synced Creator Waveform ({project.creatorDNA.audioName})</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {((playhead / 100) * durationSec).toFixed(1)}s / {durationSec}.0s
              </span>
            </div>
            
            {/* Waveform graphic container */}
            <div 
              onClick={handleTimelineScrub}
              style={{ position: 'relative', height: '36px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', overflow: 'hidden', cursor: 'ew-resize', display: 'flex', alignItems: 'flex-end', gap: '2px', padding: '0 4px' }}
            >
              {/* Draw waveform bars */}
              {Array.from({ length: 60 }).map((_, idx) => {
                const height = Math.abs(Math.sin(idx * 0.15)) * 25 + Math.cos(idx * 0.4) * 8 + 10;
                const isPassed = (idx / 60) * 100 <= playhead;
                const isActive = Math.abs((idx / 60) * 100 - playhead) < 1.6;
                return (
                  <div 
                    key={idx} 
                    style={{
                      flex: 1,
                      height: `${height}%`,
                      background: isActive 
                        ? 'var(--neon-cyan)' 
                        : isPassed 
                          ? 'var(--neon-purple)' 
                          : 'rgba(255,255,255,0.12)',
                      borderRadius: '1px',
                      transition: 'background 0.1s'
                    }}
                  />
                );
              })}
              
              {/* Playhead bar */}
              <div 
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${playhead}%`,
                  width: '2px',
                  backgroundColor: 'var(--neon-cyan)',
                  boxShadow: '0 0 8px var(--neon-cyan)',
                  zIndex: 20,
                  pointerEvents: 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Storyboard Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Storyboard Scene Timeline</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
            Scroll horizontal. Select a scene to inspect variables. Lock features to protect them when remixing.
          </p>
        </div>
        {selectedScene && (
          <div style={{ fontSize: '0.75rem', color: 'var(--neon-amber)', background: 'rgba(245,158,11,0.1)', padding: '4px 8px', borderRadius: '4px', border: '1px solid rgba(245,158,11,0.2)' }}>
            Inspecting Scene {selectedScene.id.replace('scene-', '')}
          </div>
        )}
      </div>

      {/* Scene cards row */}
      <div className="timeline-track">
        {scenes.map((scene, idx) => {
          const isActive = scene.id === activeSceneId;
          const isSelected = selectedScene?.id === scene.id;

          return (
            <div 
              key={scene.id}
              className={`scene-card ${isActive ? 'active' : ''}`}
              onClick={() => setSelectedScene(scene)}
              onMouseEnter={() => setHoveredSceneId(scene.id)}
              onMouseLeave={() => setHoveredSceneId(null)}
              style={{
                border: isSelected ? '2px solid var(--neon-cyan)' : isActive ? '1px solid var(--neon-purple)' : '1px solid var(--border-subtle)',
                background: isSelected ? 'rgba(6, 182, 212, 0.05)' : isActive ? 'rgba(139, 92, 246, 0.04)' : 'rgba(255,255,255,0.01)',
                cursor: 'pointer'
              }}
            >
              {/* Canvas keyframe */}
              <div className="scene-preview-frame">
                <SceneCanvas scene={scene} isHovered={hoveredSceneId === scene.id} />
                <span className="badge" style={{ position: 'absolute', bottom: '6px', left: '6px', fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(0,0,0,0.7)', color: '#fff' }}>
                  {scene.timestamp}
                </span>
                
                {/* Locks panel top right */}
                <div className="scene-card-locks" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className={`lock-btn ${scene.locked.character ? 'locked' : ''}`}
                    onClick={() => onToggleSceneLock(scene.id, 'character')}
                    title="Lock Character Likeness"
                  >
                    👤
                  </button>
                  <button 
                    className={`lock-btn ${scene.locked.outfit ? 'locked' : ''}`}
                    onClick={() => onToggleSceneLock(scene.id, 'outfit')}
                    title="Lock Outfit/Wardrobe"
                  >
                    🧥
                  </button>
                  <button 
                    className={`lock-btn ${scene.locked.palette ? 'locked' : ''}`}
                    onClick={() => onToggleSceneLock(scene.id, 'palette')}
                    title="Lock Color Palette"
                  >
                    🎨
                  </button>
                </div>
              </div>

              {/* Scene content details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--neon-purple)' }}>SCENE {idx + 1}</span>
                  <span className="badge badge-green" style={{ fontSize: '0.55rem', padding: '1px 4px' }}>
                    {scene.safetyStatus}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-main)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: '30px', lineHeight: '1.2' }}>
                  {scene.description}
                </p>
              </div>

              {/* Source uploads links */}
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '6px' }}>
                {scene.sourceAssetLinks.map((link, lIdx) => (
                  <span key={lIdx} style={{ fontSize: '0.6rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 4px', borderRadius: '3px', whiteSpace: 'nowrap' }}>
                    🔗 {link.split('/').pop()}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Scene Inspector Details drawer */}
      {selectedScene && (
        <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--neon-cyan)' }}>
              Selected Scene Prompt & Parameters (Scene {selectedScene.id.replace('scene-', '')})
            </span>
            <button 
              className="btn-secondary" 
              onClick={() => setSelectedScene(null)} 
              style={{ padding: '2px 8px', fontSize: '0.7rem' }}
            >
              Close
            </button>
          </div>
          
          <div style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '4px', fontFamily: 'var(--font-mono)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <span style={{ color: 'var(--neon-purple)', fontWeight: 600 }}>PROMPT PACK: </span>
            <span style={{ color: 'var(--text-main)' }}>{selectedScene.prompt}</span>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Visual Continuity locks: </span>
              {Object.entries(selectedScene.locked).some(([_, v]) => v) ? (
                <span style={{ color: 'var(--neon-amber)', fontWeight: 'bold' }}>
                  {Object.entries(selectedScene.locked)
                    .filter(([_, v]) => v)
                    .map(([k]) => k)
                    .join(', ')} active
                </span>
              ) : (
                <span style={{ color: 'var(--text-dark)' }}>No features locked</span>
              )}
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Safety: </span>
              <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>Passed Verification</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
