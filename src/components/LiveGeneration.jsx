import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Download,
  FileVideo,
  Film,
  Loader2,
  Music,
  Sparkles,
  Upload,
  Wand2
} from 'lucide-react';
import {
  createLivePlan,
  createLyriaPlan,
  getManagedAgents,
  getVideoJob,
  runManagedAgentSwarm,
  startVideoJob
} from '../services/liveApi';

const defaultBrief = 'Original one-minute performance music video using my uploaded creator assets. Make it cinematic, rhythmic, and rights-safe. Use 10 coherent scenes with a strong hook, verse, chorus, bridge, final chorus, and outro.';

const fixedConstraints = 'Use only original, rights-safe aesthetics. Preserve uploaded creator movement conceptually. No copyrighted characters, named artist imitation, celebrity likeness, or franchise references.';

function SceneGenerationCard({ scene, onStart, job, fallbackDuration }) {
  const isRunning = job?.status === 'running';
  const isDone = job?.status === 'completed';

  return (
    <article className="scene-tile">
      <div className="scene-tile-head">
        <span>{scene.startSec}s-{scene.endSec}s</span>
        <strong>{scene.title}</strong>
      </div>

      <p>{scene.description}</p>

      <div className="scene-meta">
        <span>{scene.durationSeconds || fallbackDuration}s</span>
        <span>{scene.aspectRatio || '9:16'}</span>
      </div>

      {isDone && job.outputUrl && (
        <video className="generated-video" controls src={job.outputUrl} />
      )}

      <details className="prompt-details">
        <summary>Prompt</summary>
        <pre>{scene.veoPrompt}</pre>
      </details>

      <button
        className={isDone ? 'btn-secondary' : 'btn-primary'}
        disabled={isRunning}
        onClick={() => onStart(scene)}
      >
        {isRunning ? <Loader2 size={16} className="spin-icon" /> : isDone ? <Download size={16} /> : <Film size={16} />}
        <span>{isRunning ? 'Generating...' : isDone ? 'Regenerate' : 'Generate clip'}</span>
      </button>

      {job?.error && (
        <div className="inline-error">
          <AlertTriangle size={15} />
          <span>{job.error}</span>
        </div>
      )}
    </article>
  );
}

export default function LiveGeneration({ health }) {
  const [brief, setBrief] = useState(defaultBrief);
  const [targetFormat, setTargetFormat] = useState('9:16');
  const [durationSeconds, setDurationSeconds] = useState(60);
  const [sceneCount, setSceneCount] = useState(10);
  const [assets, setAssets] = useState([]);
  const [planResponse, setPlanResponse] = useState(null);
  const [lyriaPlan, setLyriaPlan] = useState(null);
  const [managedAgents, setManagedAgents] = useState([]);
  const [swarmResult, setSwarmResult] = useState(null);
  const [jobs, setJobs] = useState({});
  const [isPlanning, setIsPlanning] = useState(false);
  const [isMakingLyriaPlan, setIsMakingLyriaPlan] = useState(false);
  const [isRunningSwarm, setIsRunningSwarm] = useState(false);
  const [error, setError] = useState('');

  const plan = planResponse?.plan;
  const scenes = useMemo(() => plan?.scenes || [], [plan]);
  const fallbackDuration = Math.max(1, Math.round(durationSeconds / sceneCount));

  useEffect(() => {
    getManagedAgents()
      .then((response) => setManagedAgents(response.roles || []))
      .catch(() => setManagedAgents([]));
  }, []);

  useEffect(() => {
    const runningIds = Object.values(jobs)
      .filter((job) => job.status === 'running')
      .map((job) => job.jobId || job.id);

    if (runningIds.length === 0) return undefined;

    const interval = setInterval(async () => {
      for (const jobId of runningIds) {
        try {
          const updated = await getVideoJob(jobId);
          setJobs((prev) => ({
            ...prev,
            [updated.sceneId]: {
              ...prev[updated.sceneId],
              ...updated,
              jobId
            }
          }));
        } catch (err) {
          setJobs((prev) => {
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
    setSwarmResult(null);
    setJobs({});
    setIsPlanning(true);

    try {
      const response = await createLivePlan({
        brief,
        targetFormat,
        durationSeconds,
        sceneCount,
        constraints: fixedConstraints,
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
    setJobs((prev) => ({
      ...prev,
      [scene.id]: { sceneId: scene.id, status: 'running' }
    }));

    try {
      const response = await startVideoJob({
        sceneId: scene.id,
        prompt: scene.veoPrompt,
        negativePrompt: scene.negativePrompt,
        aspectRatio: scene.aspectRatio || targetFormat,
        durationSeconds: scene.durationSeconds || fallbackDuration
      });
      setJobs((prev) => ({
        ...prev,
        [scene.id]: response
      }));
    } catch (err) {
      setJobs((prev) => ({
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
      <form className="composer" onSubmit={handleCreatePlan}>
        <label className="prompt-field">
          <span>Creative direction</span>
          <textarea
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            rows={5}
            className="studio-textarea"
          />
        </label>

        <div className="control-row">
          <label>
            <span>Format</span>
            <select value={targetFormat} onChange={(event) => setTargetFormat(event.target.value)} className="studio-select">
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
              <option value="1:1">1:1</option>
            </select>
          </label>
          <label>
            <span>Length</span>
            <input value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))} type="number" min="10" max="60" className="studio-input" />
          </label>
          <label>
            <span>Scenes</span>
            <input value={sceneCount} onChange={(event) => setSceneCount(Number(event.target.value))} type="number" min="1" max="10" className="studio-input" />
          </label>
        </div>

        <label className="upload-strip">
          <Upload size={18} />
          <div>
            <strong>{assets.length ? `${assets.length} asset${assets.length === 1 ? '' : 's'} added` : 'Add assets'}</strong>
            <span>{assets.length ? assets.map((file) => file.name).join(', ') : 'Audio, video, images, lyrics'}</span>
          </div>
          <input type="file" multiple onChange={handleAssets} />
        </label>

        {error && (
          <div className="inline-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button className="btn-primary composer-cta" disabled={isPlanning || !health?.configured}>
          {isPlanning ? <Loader2 size={16} className="spin-icon" /> : <Wand2 size={16} />}
          <span>{isPlanning ? 'Planning...' : 'Create 10-scene plan'}</span>
        </button>
      </form>

      {plan ? (
        <div className="results-grid">
          <section className="plan-panel">
            <div className="panel-header">
              <div>
                <span>Plan</span>
                <h2>{plan.title}</h2>
              </div>
              <strong>{plan.safetyReport?.originalityScore ?? 'n/a'}</strong>
            </div>

            <p>{plan.styleBible?.logline}</p>

            <div className="metric-row">
              <div>
                <span>BPM</span>
                <strong>{plan.musicAnalysis?.bpmEstimate || 'n/a'}</strong>
              </div>
              <div>
                <span>Safety</span>
                <strong>{plan.safetyReport?.status || 'n/a'}</strong>
              </div>
              <div>
                <span>Agents</span>
                <strong>{managedAgents.length || 12}</strong>
              </div>
            </div>

            <div className="music-sections">
              {(plan.musicAnalysis?.sections || []).map((section, index) => (
                <div key={`${section.label}-${index}`}>
                  <span>{section.startSec}s-{section.endSec}s</span>
                  <strong>{section.label}</strong>
                  <small>{section.mood}</small>
                </div>
              ))}
            </div>

            <div className="action-row">
              <button className="btn-secondary" onClick={handleLyriaPlan} disabled={isMakingLyriaPlan}>
                {isMakingLyriaPlan ? <Loader2 size={16} className="spin-icon" /> : <Music size={16} />}
                <span>Audio plan</span>
              </button>

              <button className="btn-primary" onClick={handleManagedAgentSwarm} disabled={isRunningSwarm}>
                {isRunningSwarm ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
                <span>{isRunningSwarm ? 'Checking...' : 'Agent check'}</span>
              </button>
            </div>

            {lyriaPlan && (
              <details className="result-details" open>
                <summary>Audio control</summary>
                <pre>{JSON.stringify(lyriaPlan, null, 2)}</pre>
              </details>
            )}

            {swarmResult && (
              <div className="agent-report">
                <div className="agent-score">
                  <span>Agent result</span>
                  <strong>{swarmResult.aggregate?.averageScore}</strong>
                </div>
                <div className="swarm-metrics">
                  <div><strong>{swarmResult.aggregate?.pass}</strong><span>Pass</span></div>
                  <div><strong>{swarmResult.aggregate?.warn}</strong><span>Warn</span></div>
                  <div><strong>{swarmResult.aggregate?.blocked}</strong><span>Block</span></div>
                </div>
                <div className="swarm-agent-list">
                  {swarmResult.results?.map((item) => (
                    <details key={item.role.id} className="result-details">
                      <summary>
                        <span>{item.result.agentName || item.role.name}</span>
                        <b>{item.result.status} · {item.result.score}</b>
                      </summary>
                      <pre>{JSON.stringify(item.result, null, 2)}</pre>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="scene-grid">
            {scenes.map((scene) => (
              <SceneGenerationCard
                key={scene.id}
                scene={scene}
                job={jobs[scene.id]}
                fallbackDuration={fallbackDuration}
                onStart={handleGenerateScene}
              />
            ))}
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <FileVideo size={28} />
          <strong>No plan yet</strong>
          <span>Start with a prompt or assets.</span>
        </div>
      )}
    </div>
  );
}
