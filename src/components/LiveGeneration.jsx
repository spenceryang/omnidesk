import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Cloud,
  Download,
  FileVideo,
  Film,
  Loader2,
  Music,
  Sparkles,
  Upload
} from 'lucide-react';
import {
  createLivePlan,
  createLyriaPlan,
  getManagedAgents,
  getVideoJob,
  runManagedAgentReview,
  runManagedAgentSwarm,
  startVideoJob
} from '../services/liveApi';

const defaultBrief = 'Original one-minute neon performance music video using my uploaded creator assets. Break it into 10 coherent scenes with a strong hook, verse, chorus, bridge, final chorus, and outro. Keep cinematic camera movement, strong continuity, and no franchise references or named artist imitation.';

function SceneGenerationCard({ scene, onStart, job }) {
  const isRunning = job?.status === 'running';
  const isDone = job?.status === 'completed';

  return (
    <div className="live-scene-card">
      <div className="live-scene-top">
        <div>
          <span className="badge badge-cyan">{scene.startSec}s-{scene.endSec}s</span>
          <h4>{scene.title}</h4>
        </div>
        <span className="badge badge-purple">{scene.durationSeconds || 8}s Veo</span>
      </div>
      <p>{scene.description}</p>
      <div className="prompt-box">{scene.veoPrompt}</div>
      {isDone && job.outputUrl && (
        <video className="generated-video" controls src={job.outputUrl} />
      )}
      <button
        className={isDone ? 'btn-secondary' : 'btn-primary'}
        disabled={isRunning}
        onClick={() => onStart(scene)}
      >
        {isRunning ? <Loader2 size={16} className="spin-icon" /> : isDone ? <Download size={16} /> : <Film size={16} />}
        <span>{isRunning ? 'Generating with Veo...' : isDone ? 'Generate Again' : 'Generate Live Clip'}</span>
      </button>
      {job?.error && (
        <div className="live-error">
          <AlertTriangle size={15} />
          <span>{job.error}</span>
        </div>
      )}
    </div>
  );
}

export default function LiveGeneration({ health }) {
  const [brief, setBrief] = useState(defaultBrief);
  const [targetFormat, setTargetFormat] = useState('9:16');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [sceneCount, setSceneCount] = useState(10);
  const [constraints, setConstraints] = useState('Use only original, rights-safe aesthetics. Preserve uploaded creator movement conceptually. No copyrighted characters, no named artist imitation, no celebrity likeness.');
  const [assets, setAssets] = useState([]);
  const [planResponse, setPlanResponse] = useState(null);
  const [lyriaPlan, setLyriaPlan] = useState(null);
  const [agentReview, setAgentReview] = useState(null);
  const [managedAgents, setManagedAgents] = useState([]);
  const [swarmResult, setSwarmResult] = useState(null);
  const [jobs, setJobs] = useState({});
  const [isPlanning, setIsPlanning] = useState(false);
  const [isMakingLyriaPlan, setIsMakingLyriaPlan] = useState(false);
  const [isReviewingWithAgent, setIsReviewingWithAgent] = useState(false);
  const [isRunningSwarm, setIsRunningSwarm] = useState(false);
  const [error, setError] = useState('');

  const plan = planResponse?.plan;
  const scenes = useMemo(() => plan?.scenes || [], [plan]);

  useEffect(() => {
    getManagedAgents()
      .then((response) => setManagedAgents(response.roles || []))
      .catch(() => setManagedAgents([]));
  }, []);

  useEffect(() => {
    const runningIds = Object.values(jobs)
      .filter(job => job.status === 'running')
      .map(job => job.jobId || job.id);

    if (runningIds.length === 0) return undefined;

    const interval = setInterval(async () => {
      for (const jobId of runningIds) {
        try {
          const updated = await getVideoJob(jobId);
          setJobs(prev => ({
            ...prev,
            [updated.sceneId]: {
              ...prev[updated.sceneId],
              ...updated,
              jobId
            }
          }));
        } catch (err) {
          setJobs(prev => {
            const next = { ...prev };
            for (const [sceneId, job] of Object.entries(next)) {
              if ((job.jobId || job.id) === jobId) {
                next[sceneId] = { ...job, status: 'failed', error: err.message };
              }
            }
            return next;
          });
        }
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [jobs]);

  const handleAssets = (event) => {
    setAssets(Array.from(event.target.files || []));
  };

  const handleCreatePlan = async (event) => {
    event.preventDefault();
    setError('');
    setPlanResponse(null);
    setLyriaPlan(null);
    setAgentReview(null);
    setSwarmResult(null);
    setJobs({});
    setIsPlanning(true);
    try {
      const response = await createLivePlan({
        brief,
        targetFormat,
        durationSeconds,
        sceneCount,
        constraints,
        assets
      });
      setPlanResponse(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleGenerateScene = async (scene) => {
    setError('');
    setJobs(prev => ({
      ...prev,
      [scene.id]: { sceneId: scene.id, status: 'running' }
    }));
    try {
      const response = await startVideoJob({
        sceneId: scene.id,
        prompt: scene.veoPrompt,
        negativePrompt: scene.negativePrompt,
        aspectRatio: scene.aspectRatio || targetFormat,
        durationSeconds: scene.durationSeconds || Math.round(durationSeconds / sceneCount)
      });
      setJobs(prev => ({
        ...prev,
        [scene.id]: response
      }));
    } catch (err) {
      setJobs(prev => ({
        ...prev,
        [scene.id]: { sceneId: scene.id, status: 'failed', error: err.message }
      }));
    }
  };

  const handleLyriaPlan = async () => {
    if (!plan) return;
    setIsMakingLyriaPlan(true);
    setError('');
    try {
      const response = await createLyriaPlan({ brief, plan });
      setLyriaPlan(response.plan);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsMakingLyriaPlan(false);
    }
  };

  const handleManagedAgentReview = async () => {
    if (!plan) return;
    setIsReviewingWithAgent(true);
    setError('');
    try {
      const response = await runManagedAgentReview({ brief, plan });
      setAgentReview(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsReviewingWithAgent(false);
    }
  };

  const handleManagedAgentSwarm = async () => {
    if (!plan) return;
    setIsRunningSwarm(true);
    setError('');
    setSwarmResult(null);
    try {
      const response = await runManagedAgentSwarm({ brief, plan });
      setSwarmResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRunningSwarm(false);
    }
  };

  return (
    <div className="live-workspace">
      <div className="live-hero-panel">
        <div>
          <div className="ops-kicker">
            <Cloud size={14} />
            Live generation
          </div>
          <h1>Generate an actual music-video production plan and Veo clips.</h1>
          <p>
            Your AI Studio key stays on the local backend. Gemini 3 Flash creates the plan from your prompt and assets.
            Veo 3.1 generates scene clips as long-running jobs.
          </p>
        </div>
        <div className={`api-ready-card ${health?.configured ? 'ready' : 'missing'}`}>
          {health?.configured ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
          <div>
            <strong>{health?.configured ? 'API key detected' : 'API key missing'}</strong>
            <span>{health?.configured ? `${health.plannerModel} + ${health.videoModel}` : 'Add GEMINI_API_KEY to .env and run npm run api'}</span>
          </div>
        </div>
      </div>

      <form className="live-form-panel" onSubmit={handleCreatePlan}>
        <label>
          <span>Creative prompt</span>
          <textarea value={brief} onChange={(event) => setBrief(event.target.value)} rows={4} className="studio-textarea" />
        </label>

        <div className="live-form-grid">
          <label>
            <span>Format</span>
            <select value={targetFormat} onChange={(event) => setTargetFormat(event.target.value)} className="studio-select">
              <option value="9:16">9:16 Vertical</option>
              <option value="16:9">16:9 Landscape</option>
              <option value="1:1">1:1 Square</option>
            </select>
          </label>
          <label>
            <span>Total target seconds</span>
            <input value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))} type="number" min="10" max="60" className="studio-input" />
          </label>
          <label>
            <span>Scene count</span>
            <input value={sceneCount} onChange={(event) => setSceneCount(Number(event.target.value))} type="number" min="1" max="10" className="studio-input" />
          </label>
        </div>

        <label>
          <span>Safety and continuity constraints</span>
          <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} rows={3} className="studio-textarea" />
        </label>

        <label className="upload-strip">
          <Upload size={18} />
          <div>
            <strong>Upload song, dance clip, images, lyrics, or references</strong>
            <span>{assets.length ? `${assets.length} file(s): ${assets.map(file => file.name).join(', ')}` : 'Files are sent to Gemini Files API for planning context.'}</span>
          </div>
          <input type="file" multiple onChange={handleAssets} />
        </label>

        {error && (
          <div className="live-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button className="btn-primary" disabled={isPlanning || !health?.configured}>
          {isPlanning ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
          <span>{isPlanning ? 'Calling Gemini 3 Flash...' : 'Create Live Production Plan'}</span>
        </button>
      </form>

      {plan && (
        <div className="live-results-grid">
          <section className="glass-panel">
            <div className="live-section-header">
              <div>
                <h3>{plan.title}</h3>
                <p>{plan.styleBible?.logline}</p>
              </div>
              <span className="badge badge-green">Originality {plan.safetyReport?.originalityScore ?? 'n/a'}</span>
            </div>

            <div className="plan-summary-grid">
              <div>
                <strong>Music</strong>
                <span>{plan.musicAnalysis?.bpmEstimate || 'n/a'} BPM estimate</span>
              </div>
              <div>
                <strong>Visual language</strong>
                <span>{plan.styleBible?.visualLanguage}</span>
              </div>
              <div>
                <strong>Safety</strong>
                <span>{plan.safetyReport?.status}</span>
              </div>
            </div>

            <div className="section-list">
              {(plan.musicAnalysis?.sections || []).map((section, index) => (
                <div key={`${section.label}-${index}`}>
                  <span>{section.startSec}s-{section.endSec}s</span>
                  <strong>{section.label}</strong>
                  <small>{section.mood}</small>
                </div>
              ))}
            </div>

            <button className="btn-secondary" onClick={handleLyriaPlan} disabled={isMakingLyriaPlan}>
              {isMakingLyriaPlan ? <Loader2 size={16} className="spin-icon" /> : <Music size={16} />}
              <span>{isMakingLyriaPlan ? 'Creating Lyria plan...' : 'Create Lyria Music Control Plan'}</span>
            </button>

            <button className="btn-secondary" onClick={handleManagedAgentReview} disabled={isReviewingWithAgent}>
              {isReviewingWithAgent ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
              <span>{isReviewingWithAgent ? 'Running Managed Agent...' : 'Run Managed Agent Review'}</span>
            </button>

            <button className="btn-primary" onClick={handleManagedAgentSwarm} disabled={isRunningSwarm}>
              {isRunningSwarm ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
              <span>{isRunningSwarm ? `Running ${managedAgents.length || 12} Agents...` : `Run ${managedAgents.length || 12}-Agent Swarm`}</span>
            </button>

            {lyriaPlan && (
              <div className="prompt-box">
                {JSON.stringify(lyriaPlan, null, 2)}
              </div>
            )}

            {agentReview && (
              <div className="prompt-box">
                {agentReview.outputText}
              </div>
            )}

            {swarmResult && (
              <div className="agent-swarm-panel">
                <div className="live-section-header">
                  <div>
                    <h3>Managed Agent Swarm</h3>
                    <p>
                      {swarmResult.count} managed-agent interactions completed with {swarmResult.agent}.
                    </p>
                  </div>
                  <span className="badge badge-cyan">Avg {swarmResult.aggregate?.averageScore}</span>
                </div>
                <div className="swarm-metrics">
                  <div><strong>{swarmResult.aggregate?.pass}</strong><span>Pass</span></div>
                  <div><strong>{swarmResult.aggregate?.warn}</strong><span>Warn</span></div>
                  <div><strong>{swarmResult.aggregate?.blocked}</strong><span>Blocked</span></div>
                </div>
                <div className="swarm-agent-list">
                  {swarmResult.results?.map((item) => (
                    <details key={item.role.id} className="swarm-agent-card">
                      <summary>
                        <span>{item.result.agentName || item.role.name}</span>
                        <span className={`badge ${item.result.status === 'pass' ? 'badge-green' : item.result.status === 'blocked' ? 'badge-rose' : 'badge-amber'}`}>
                          {item.result.status} · {item.result.score}
                        </span>
                      </summary>
                      <div className="prompt-box">
                        {JSON.stringify(item.result, null, 2)}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="live-scenes">
            {scenes.map(scene => (
              <SceneGenerationCard
                key={scene.id}
                scene={scene}
                job={jobs[scene.id]}
                onStart={handleGenerateScene}
              />
            ))}
          </section>
        </div>
      )}

      {!plan && (
        <div className="empty-live-state">
          <FileVideo size={28} />
          <strong>No live plan yet</strong>
          <span>Upload assets and call Gemini to generate a scene plan, then run Veo on selected scenes.</span>
        </div>
      )}
    </div>
  );
}
