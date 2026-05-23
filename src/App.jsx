import React, { useState } from 'react';
import { 
  FolderPlus, Music, ShieldCheck, FileText, Activity, 
  GitBranch, Award, CheckCircle, ChevronRight, Play, Layout, Plus, RotateCcw 
} from 'lucide-react';

import { INITIAL_PROJECTS } from './mockData';
import ProjectSetup from './components/ProjectSetup';
import BriefInput from './components/BriefInput';
import AgentDesk from './components/AgentDesk';
import Timeline from './components/Timeline';
import RemixPanel from './components/RemixPanel';
import ExportPanel from './components/ExportPanel';

export default function App() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState(INITIAL_PROJECTS[0].id);
  const [step, setStep] = useState('timeline_review'); // 'setup' | 'brief' | 'agent_desk' | 'timeline_review'
  
  // Quick banner alerts
  const [alertMsg, setAlertMsg] = useState('');

  const activeProject = projects.find(p => p.id === activeProjectId);
  const activeBranch = activeProject ? activeProject.branches[activeProject.currentBranchId] : null;

  const handleSelectProject = (id) => {
    setActiveProjectId(id);
    const proj = projects.find(p => p.id === id);
    if (proj.brief === '') {
      setStep('brief');
    } else {
      setStep('timeline_review');
    }
  };

  const handleNewProjectClick = () => {
    setStep('setup');
  };

  const handleProjectCreated = (newProj) => {
    // Generate default main branch
    const baseBranchId = 'branch-main';
    newProj.currentBranchId = baseBranchId;
    newProj.branches = {
      [baseBranchId]: {
        id: baseBranchId,
        parentId: null,
        name: 'Main Production',
        timestamp: new Date().toLocaleString(),
        originalityScore: 90,
        originalityBreakdown: {
          userSource: 30,
          originalMotifs: 18,
          avoidedIP: 20,
          promptSpecificity: 12,
          continuity: 10
        },
        productionPlan: {
          musicAnalysis: {
            sections: [
              { name: 'Intro', range: '0:00 - 0:04', mood: 'Ambient Cues', beat: 'Low tempo' },
              { name: 'Build', range: '0:04 - 0:10', mood: 'Rising Synth Pulse', beat: 'Increasing BPM' },
              { name: 'Drop (Chorus)', range: '0:10 - 0:25', mood: 'Vibrant Heavy Drop', beat: 'Fast syncopated rhythm' },
              { name: 'Outro', range: '0:25 - 0:30', mood: 'Mellow Echoes', beat: 'Fading out' }
            ],
            beatMarkers: [1.0, 2.5, 4.0, 5.2, 6.4, 7.6, 8.8, 10.0, 11.2, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0, 18.0, 19.0, 20.0, 21.0, 22.0, 23.0, 24.0, 25.5, 27.0, 29.0]
          },
          creatorDNASummary: {
            movement: 'Extracted popping locking, sweeping hand arcs',
            palette: ['#0f172a', '#7c3aed', '#06b6d4'],
            wardrobe: newProj.creatorDNA.outfits.join(', '),
            setting: 'Abstract geometric studio background',
            motifs: newProj.creatorDNA.motifs
          },
          styleBible: {
            mood: 'Original cinematic aesthetics',
            colorPalette: ['#0f172a', '#7c3aed', '#06b6d4'],
            visualDirectives: ['High contrast shadows', 'Subtle flares matching beat peaks']
          },
          continuityRules: ['Jacket details remain consistent', 'Backdrop geometry shifts on chorus drop'],
          ipSafetyReport: { status: 'safe', flags: [], rewriteExplanation: '' }
        },
        scenes: [
          {
            id: 'scene-1',
            timestamp: '0:00 - 0:04',
            description: 'Intro: Establishing ambient shot displaying character silhouette.',
            prompt: 'Wide shot, cinematic studio, character silhouette standing center, gradient background, volumetric side lights, photorealistic, 8k.',
            sourceAssetLinks: [newProj.creatorDNA.audioName],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#1e1b4b',
            colorEnd: '#0f172a',
            graphics: 'platform'
          },
          {
            id: 'scene-2',
            timestamp: '0:04 - 0:10',
            description: 'Build-up: Rising energy close up focusing on hands gestures.',
            prompt: 'Close-up, detailed hands of dancer executing intricate wrist moves, cyan streaks of neon light trailing, dark backdrop, high contrast.',
            sourceAssetLinks: [newProj.creatorDNA.audioName],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#06b6d4',
            colorEnd: '#0f172a',
            graphics: 'hands'
          },
          {
            id: 'scene-3',
            timestamp: '0:10 - 0:25',
            description: 'Chorus: Main high energy popping choreography sequence in full frame.',
            prompt: 'Full shot, dynamic motion, dancer performing popping locking routines, vibrant violet and cyan lasers flickering behind them, wet floor reflections, premium cinematography.',
            sourceAssetLinks: [newProj.creatorDNA.audioName],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#7c3aed',
            colorEnd: '#f43f5e',
            graphics: 'dance'
          },
          {
            id: 'scene-4',
            timestamp: '0:25 - 0:30',
            description: 'Outro: Slow tracking shot, fading neon particles.',
            prompt: 'Medium shot, tracking back, dancer stands static as neon lighting slowly fades out, floating digital embers, melancholy resolution.',
            sourceAssetLinks: [newProj.creatorDNA.audioName],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#0f172a',
            colorEnd: '#020617',
            graphics: 'static'
          }
        ]
      }
    };

    setProjects(prev => [newProj, ...prev]);
    setActiveProjectId(newProj.id);
    setStep('brief');
  };

  const handleStartProduction = (briefText, rewrittenText, isSafe, ipFlags) => {
    // Update brief
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updated = { ...p, brief: briefText };
        const activeBr = updated.branches[updated.currentBranchId];
        
        // If the brief was rewritten due to safety checks
        if (!isSafe) {
          activeBr.productionPlan.ipSafetyReport = {
            status: 'flagged',
            flags: ipFlags.map(f => f.ruleLabel),
            rewriteExplanation: `Rewrote brief containing copyrighted elements into original aesthetic directives.`
          };
          
          // Apply rewritten prompts to scenes
          activeBr.scenes = activeBr.scenes.map((scene, idx) => {
            if (idx === 0) {
              scene.prompt = `Wide shot, whimsical cell-shaded animation style, character silhouette in tactical gear with colorful stripes, volumetric lighting, photorealistic.`;
            } else if (idx === 2) {
              scene.prompt = `Full shot, cell-shaded 3D animation, dancer in neon tactical outfits popping locking, glowing colorful gridlines backdrop.`;
            }
            scene.safetyStatus = 'rewritten';
            return scene;
          });

          // Lower originality slightly since agent had to force a rewrite of reference
          activeBr.originalityScore = 80;
          activeBr.originalityBreakdown.avoidedIP = 12; // penalize avoided IP since they input trademarked refs
        } else {
          activeBr.productionPlan.ipSafetyReport = {
            status: 'safe',
            flags: [],
            rewriteExplanation: 'All user input statements verified safe and original.'
          };
        }
        return updated;
      }
      return p;
    }));

    setStep('agent_desk');
  };

  const handleCompilationComplete = () => {
    setStep('timeline_review');
    setAlertMsg('Production plan compiled successfully! Storyboard timeline generated.');
    setTimeout(() => setAlertMsg(''), 5000);
  };

  const handleToggleSceneLock = (sceneId, lockType) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updated = { ...p };
        const activeBr = updated.branches[updated.currentBranchId];
        activeBr.scenes = activeBr.scenes.map(s => {
          if (s.id === sceneId) {
            return {
              ...s,
              locked: {
                ...s.locked,
                [lockType]: !s.locked[lockType]
              }
            };
          }
          return s;
        });
        return updated;
      }
      return p;
    }));
  };

  const handleSwitchBranch = (branchId) => {
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return { ...p, currentBranchId: branchId };
      }
      return p;
    }));
    setAlertMsg(`Switched to version: ${activeProject.branches[branchId].name}`);
    setTimeout(() => setAlertMsg(''), 4000);
  };

  const handleApplyRemix = (remixText) => {
    const isRooftop = remixText.toLowerCase().includes('rooftop') || remixText.toLowerCase().includes('rain');
    const isBright = remixText.toLowerCase().includes('bright') || remixText.toLowerCase().includes('light') || remixText.toLowerCase().includes('cyan');
    
    const newBranchId = 'branch-' + Date.now();
    const newBranchName = `Remix: ${remixText.length > 22 ? remixText.substring(0, 20) + '...' : remixText}`;

    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updated = { ...p };
        const parentBranch = updated.branches[updated.currentBranchId];

        // Deep copy parent scenes
        const newScenes = parentBranch.scenes.map(s => {
          const sc = { ...s, locked: { ...s.locked } };
          
          // Modify prompt of unlocked elements
          if (!sc.locked.character) {
            // Apply character changes
          }
          if (!sc.locked.outfit) {
            // Apply outfit
          }
          if (!sc.locked.location) {
            if (isRooftop) {
              sc.prompt = sc.prompt.replace(/train station|studio|concrete platform/gi, 'rain-soaked skyline rooftop platform');
              sc.prompt += ', wet concrete puddle reflections, dark stormy clouds background';
              sc.colorStart = '#0f172a';
              sc.colorEnd = '#2563eb';
              sc.graphics = 'static'; // trigger grid visual
            }
          }
          if (!sc.locked.palette) {
            if (isBright) {
              sc.prompt += ', overexposed bright cyber cyan glowing lights, light leak flares';
              sc.colorStart = '#06b6d4';
              sc.colorEnd = '#164e63';
              sc.graphics = 'spurs'; // spur ring graphics
            }
          }

          // Mark scene as remixed
          sc.safetyStatus = 'modified';
          return sc;
        });

        // Update score slightly
        const currentScore = parentBranch.originalityScore;
        const newScore = Math.max(75, currentScore - (isRooftop ? 5 : 2)); // slight deduction for environment modification from original DNA uploads

        updated.branches[newBranchId] = {
          id: newBranchId,
          parentId: parentBranch.id,
          name: newBranchName,
          timestamp: new Date().toLocaleString(),
          originalityScore: newScore,
          originalityBreakdown: {
            ...parentBranch.originalityBreakdown,
            originalMotifs: Math.max(14, parentBranch.originalityBreakdown.originalMotifs - 2),
            continuity: Math.min(15, parentBranch.originalityBreakdown.continuity + 1) // continuity checks rewards locked components
          },
          productionPlan: {
            ...parentBranch.productionPlan,
            styleBible: {
              ...parentBranch.productionPlan.styleBible,
              mood: `Remixed: ${remixText}. ${parentBranch.productionPlan.styleBible.mood}`
            }
          },
          scenes: newScenes
        };

        updated.currentBranchId = newBranchId;
        return updated;
      }
      return p;
    }));

    setAlertMsg(`Successfully branched workspace into "${newBranchName}"`);
    setTimeout(() => setAlertMsg(''), 5000);
  };

  return (
    <div className="studio-layout">
      
      {/* Sidebar: Projects & uploads */}
      <aside className="sidebar-panel">
        
        {/* App Title logo */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--neon-purple) 0%, var(--neon-cyan) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: '#fff', fontSize: '1.2rem', boxShadow: '0 0 10px var(--neon-purple-glow)' }}>O</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 900, letterSpacing: '0.02em', color: '#fff' }}>Omnidesk</span>
            <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--neon-cyan)', fontWeight: 700, letterSpacing: '0.05em' }}>Agentic Studio</span>
          </div>
        </div>

        {/* Action: New Project */}
        <div style={{ padding: '16px 20px' }}>
          <button onClick={handleNewProjectClick} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Plus size={16} />
            <span>New Video Project</span>
          </button>
        </div>

        {/* Navigation Section: Projects list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 20px 20px 20px', flex: 1, overflowY: 'auto' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Projects
          </span>
          {projects.map(p => {
            const isActive = p.id === activeProjectId;
            return (
              <div 
                key={p.id}
                onClick={() => handleSelectProject(p.id)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: isActive ? '1px solid rgba(139, 92, 246, 0.4)' : '1px solid transparent',
                  background: isActive ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                  color: isActive ? 'var(--neon-purple)' : 'var(--text-main)',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '0.85rem' }}>{p.name}</span>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dark)' }}>{p.format} ({p.length})</span>
                </div>
                {isActive && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--neon-cyan)' }} />}
              </div>
            );
          })}
        </div>

        {/* DNA Signal Quick summary of active project */}
        {activeProject && step !== 'setup' && (
          <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px', background: 'rgba(0,0,0,0.15)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-dark)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
              🧬 Creator DNA Extract
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)' }}>
                <span>🎵 Audio:</span>
                <span style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeProject.creatorDNA.audioName}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)' }}>
                <span>🕺 Dance:</span>
                <span style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeProject.creatorDNA.danceClip}</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', color: 'var(--text-muted)' }}>
                <span>🧥 Outfit:</span>
                <span style={{ color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeProject.creatorDNA.outfits[0]}</span>
              </div>
            </div>
          </div>
        )}

      </aside>

      {/* Main Workspace Frame */}
      <main className="main-content">
        
        {/* Workspace Sticky Header */}
        <header className="studio-header">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>
                {step === 'setup' ? 'Setup Studio Workspace' : activeProject ? activeProject.name : 'Omnidesk Studio'}
              </h2>
              {step !== 'setup' && activeBranch && (
                <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                  Branch: {activeBranch.name}
                </span>
              )}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              {step === 'setup' && 'Initialize formats and uploads'}
              {step === 'brief' && 'Creative direction details'}
              {step === 'agent_desk' && 'Compiling music cues and scenes plans'}
              {step === 'timeline_review' && 'Timeline storyboard review & remix workspace'}
            </p>
          </div>

          {/* Quick Step Indicators */}
          {step !== 'setup' && activeProject && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {[
                { name: 'DNA & Brief', active: step === 'brief' },
                { name: 'Agent Compile', active: step === 'agent_desk' },
                { name: 'Storyboard Studio', active: step === 'timeline_review' }
              ].map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    color: item.active ? 'var(--neon-cyan)' : 'var(--text-dark)',
                    borderBottom: item.active ? '2px solid var(--neon-cyan)' : 'none',
                    paddingBottom: '2px'
                  }}>
                    {item.name}
                  </span>
                  {idx < 2 && <ChevronRight size={12} style={{ color: 'var(--text-dark)' }} />}
                </div>
              ))}
            </div>
          )}
        </header>

        {/* Global alert messages */}
        {alertMsg && (
          <div style={{ position: 'absolute', top: '75px', left: '24px', right: '24px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)', borderRadius: '8px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)', zIndex: 100, backdropFilter: 'blur(10px)' }}>
            <CheckCircle size={18} style={{ color: 'var(--neon-purple)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{alertMsg}</span>
          </div>
        )}

        {/* Screens Routers */}
        <div style={{ padding: '24px', flex: 1 }}>
          
          {step === 'setup' && (
            <ProjectSetup 
              onProjectCreated={handleProjectCreated} 
            />
          )}

          {step === 'brief' && activeProject && (
            <div style={{ maxWidth: '780px', margin: '0 auto' }}>
              <BriefInput 
                project={activeProject} 
                onStartProduction={(briefText, rewrittenText, isSafe, ipFlags) => handleStartProduction(briefText, rewrittenText, isSafe, ipFlags)}
              />
            </div>
          )}

          {step === 'agent_desk' && activeProject && (
            <div style={{ maxWidth: '780px', margin: '0 auto' }}>
              <AgentDesk 
                isFlagged={activeProject.brief.toLowerCase().includes('disney') || activeProject.brief.toLowerCase().includes('fortnite') || activeProject.brief.toLowerCase().includes('marvel')}
                onCompilationComplete={handleCompilationComplete}
              />
            </div>
          )}

          {step === 'timeline_review' && activeProject && activeBranch && (
            <div className="dashboard-grid" style={{ padding: 0 }}>
              
              {/* Left Column: Storyboard, Timeline, Remix command bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <Timeline 
                  project={activeProject}
                  activeBranch={activeBranch}
                  onToggleSceneLock={handleToggleSceneLock}
                />
                
                <RemixPanel 
                  project={activeProject}
                  activeBranch={activeBranch}
                  onApplyRemix={handleApplyRemix}
                  onSwitchBranch={handleSwitchBranch}
                />
              </div>

              {/* Right Column: Originality gauge, export, provenance card */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <ExportPanel 
                  project={activeProject}
                  activeBranch={activeBranch}
                />
              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
