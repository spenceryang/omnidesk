import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  compileVideo,
  createLivePlan,
  createLyriaPlan,
  createLyriaTrack,
  getManagedAgents,
  getVideoJob,
  runManagedAgentSwarm,
  startVideoJob
} from '../services/liveApi';

const defaultBrief = 'Original 16-second performance music video using my lyrics, prompt, or uploaded creator assets. Make it cinematic, rhythmic, and rights-safe. Use two generated 8-second scenes under one continuous music track.';

const fixedConstraints = 'Use only original, rights-safe aesthetics. Preserve uploaded creator movement conceptually. No copyrighted characters, named artist imitation, celebrity likeness, or franchise references. Keep one continuous music bed across the full video; do not create separate songs per scene.';
const VIDEO_POLL_INTERVAL_MS = 30_000;
const MIN_VIDEO_START_INTERVAL_MS = 70_000;
const MAX_VIDEO_POLLS = 60;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isQuotaError(message = '') {
  return /quota|rate.?limit|resource has been exhausted/i.test(message);
}

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
  const [lyrics, setLyrics] = useState('');
  const [targetFormat, setTargetFormat] = useState('9:16');
  const [durationSeconds, setDurationSeconds] = useState(16);
  const [sceneCount, setSceneCount] = useState(2);
  const [assets, setAssets] = useState([]);
  const [planResponse, setPlanResponse] = useState(null);
  const [projectId, setProjectId] = useState(null);
  const [lyriaPlan, setLyriaPlan] = useState(null);
  const [musicTrack, setMusicTrack] = useState(null);
  const [managedAgents, setManagedAgents] = useState([]);
  const [swarmResult, setSwarmResult] = useState(null);
  const [jobs, setJobs] = useState({});
  const [finalVideo, setFinalVideo] = useState(null);
  const [autoCompile, setAutoCompile] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isMakingLyriaPlan, setIsMakingLyriaPlan] = useState(false);
  const [isGeneratingMusicTrack, setIsGeneratingMusicTrack] = useState(false);
  const [isRunningSwarm, setIsRunningSwarm] = useState(false);
  const [error, setError] = useState('');

  const plan = planResponse?.plan;
  const scenes = useMemo(() => plan?.scenes || [], [plan]);
  const fallbackDuration = Math.max(1, Math.round(durationSeconds / sceneCount));
  const completedClips = useMemo(() => (
    scenes
      .map((scene) => ({ scene, job: jobs[scene.id] }))
      .filter(({ job }) => job?.status === 'completed' && job.outputUrl)
      .map(({ scene, job }) => ({
        sceneId: scene.id,
        title: scene.title,
        outputUrl: job.outputUrl
      }))
  ), [jobs, scenes]);
  const completedClipCount = completedClips.length;
  const allClipsComplete = scenes.length > 0 && completedClipCount === scenes.length;

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
    }, VIDEO_POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [jobs]);

  const pollVideoJobUntilComplete = async ({ jobId, sceneId }) => {
    for (let attempt = 0; attempt < MAX_VIDEO_POLLS; attempt += 1) {
      await wait(VIDEO_POLL_INTERVAL_MS);
      const updated = await getVideoJob(jobId);
      setJobs((prev) => ({
        ...prev,
        [updated.sceneId || sceneId]: {
          ...prev[updated.sceneId || sceneId],
          ...updated,
          jobId
        }
      }));

      if (updated.status === 'completed') return updated;
      if (updated.status === 'failed') {
        throw new Error(updated.error || 'Video generation failed.');
      }
    }

    throw new Error('Video generation is still running. Wait a bit, then refresh the clip status.');
  };

  const handleAssets = (event) => {
    setAssets(Array.from(event.target.files || []));
  };

  const handleCreatePlan = async (event) => {
    event.preventDefault();
    setError('');
    setPlanResponse(null);
    setProjectId(null);
    setLyriaPlan(null);
    setMusicTrack(null);
    setSwarmResult(null);
    setJobs({});
    setFinalVideo(null);
    setAutoCompile(false);
    setIsPlanning(true);

    try {
      const response = await createLivePlan({
        brief,
        targetFormat,
        durationSeconds,
        sceneCount,
        constraints: fixedConstraints,
        lyrics,
        assets
      });
      setPlanResponse(response);
      setProjectId(response.projectId || response.project?.id || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsPlanning(false);
    }
  };

  const startSceneGeneration = async (scene) => {
    setError('');
    setJobs((prev) => ({
      ...prev,
      [scene.id]: { sceneId: scene.id, status: 'running' }
    }));

    try {
      const response = await startVideoJob({
        projectId,
        sceneId: scene.id,
        sceneTitle: scene.title,
        prompt: scene.veoPrompt,
        negativePrompt: scene.negativePrompt,
        aspectRatio: scene.aspectRatio || targetFormat,
        durationSeconds: scene.durationSeconds || fallbackDuration
      });
      setJobs((prev) => ({
        ...prev,
        [scene.id]: response
      }));
      return response;
    } catch (err) {
      setJobs((prev) => ({
        ...prev,
        [scene.id]: { sceneId: scene.id, status: 'failed', error: err.message }
      }));
      throw err;
    }
  };

  const handleGenerateScene = async (scene) => {
    try {
      await startSceneGeneration(scene);
    } catch {
      // Error state is already written into the scene job.
    }
  };

  const generateMusicTrack = useCallback(async () => {
    if (!plan) return null;
    setError('');
    setIsGeneratingMusicTrack(true);

    try {
      const response = await createLyriaTrack({
        brief,
        lyrics,
        plan,
        projectId,
        durationSeconds
      });
      setMusicTrack(response.musicTrack);
      return response.musicTrack;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsGeneratingMusicTrack(false);
    }
  }, [brief, durationSeconds, lyrics, plan, projectId]);

  const handleCompileVideo = useCallback(async () => {
    if (!plan || !allClipsComplete) return;
    setError('');
    setIsCompiling(true);
    try {
      const track = musicTrack || await generateMusicTrack();
      const response = await compileVideo({
        projectId,
        title: plan.title || 'omnidesk-final',
        clips: completedClips,
        musicTrack: track
      });
      setFinalVideo(response);
      setAutoCompile(false);
    } catch (err) {
      setError(err.message);
      setAutoCompile(false);
    } finally {
      setIsCompiling(false);
    }
  }, [allClipsComplete, completedClips, generateMusicTrack, musicTrack, plan, projectId]);

  useEffect(() => {
    if (autoCompile && allClipsComplete && !isCompiling && !finalVideo) {
      handleCompileVideo();
    }
  }, [allClipsComplete, autoCompile, finalVideo, handleCompileVideo, isCompiling]);

  const handleGenerateAllAndCompile = async () => {
    if (!plan || scenes.length === 0) return;
    setError('');
    setFinalVideo(null);
    setAutoCompile(true);
    setIsGeneratingAll(true);
    let lastStartAt = 0;

    try {
      for (const scene of scenes) {
        const job = jobs[scene.id];
        if (job?.status === 'completed') continue;

        if (job?.status === 'running' && (job.jobId || job.id)) {
          await pollVideoJobUntilComplete({ jobId: job.jobId || job.id, sceneId: scene.id });
          continue;
        }

        const elapsedSinceLastStart = Date.now() - lastStartAt;
        if (lastStartAt && elapsedSinceLastStart < MIN_VIDEO_START_INTERVAL_MS) {
          await wait(MIN_VIDEO_START_INTERVAL_MS - elapsedSinceLastStart);
        }

        const started = await startSceneGeneration(scene);
        lastStartAt = Date.now();
        await pollVideoJobUntilComplete({ jobId: started.jobId || started.id, sceneId: scene.id });
      }
    } catch (err) {
      setError(isQuotaError(err.message)
        ? 'Google quota was hit. Wait for the model quota window to reset, or check the project limits in AI Studio. Generated clips already saved in Discover will stay available.'
        : err.message);
      setAutoCompile(false);
    } finally {
      setIsGeneratingAll(false);
    }
  };

  const handleLyriaPlan = async () => {
    if (!plan) return;
    setIsMakingLyriaPlan(true);
    setError('');

    try {
      const response = await createLyriaPlan({ brief, plan, projectId });
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
      const response = await runManagedAgentSwarm({ brief, plan, projectId });
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

        <label className="lyrics-field">
          <span>Lyrics</span>
          <textarea
            value={lyrics}
            onChange={(event) => setLyrics(event.target.value)}
            rows={4}
            className="studio-textarea compact"
            placeholder="Paste lyrics, hook, chorus, or rough vocal idea"
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
            <input value={durationSeconds} onChange={(event) => setDurationSeconds(Number(event.target.value))} type="number" min="8" max="60" className="studio-input" />
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
            <span>{assets.length ? assets.map((file) => file.name).join(', ') : 'Audio, video, images'}</span>
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
          <span>{isPlanning ? 'Planning...' : 'Create music video plan'}</span>
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
                <span>Plan music cues</span>
              </button>

              <button className="btn-secondary" onClick={generateMusicTrack} disabled={isGeneratingMusicTrack}>
                {isGeneratingMusicTrack ? <Loader2 size={16} className="spin-icon" /> : <Music size={16} />}
                <span>{musicTrack ? 'Regenerate Lyria track' : 'Generate Lyria track'}</span>
              </button>

              <button className="btn-primary" onClick={handleManagedAgentSwarm} disabled={isRunningSwarm}>
                {isRunningSwarm ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
                <span>{isRunningSwarm ? 'Checking...' : 'Run agent review'}</span>
              </button>
            </div>

            <div className="render-panel">
              <div>
                <span>Final render</span>
                <strong>{completedClipCount}/{scenes.length} clips ready</strong>
                <small>Generate all runs one Veo clip at a time. The default 16-second render uses two 8-second Veo clips.</small>
              </div>
              <button
                className="btn-primary"
                onClick={handleGenerateAllAndCompile}
                disabled={isGeneratingAll || isCompiling || scenes.length === 0}
              >
                {isGeneratingAll || (autoCompile && !allClipsComplete) ? <Loader2 size={16} className="spin-icon" /> : <Film size={16} />}
                <span>{isGeneratingAll || (autoCompile && !allClipsComplete) ? 'Generating clips...' : 'Generate all & combine'}</span>
              </button>
              <button
                className="btn-secondary"
                onClick={handleCompileVideo}
                disabled={!allClipsComplete || isCompiling}
              >
                {isCompiling ? <Loader2 size={16} className="spin-icon" /> : <Download size={16} />}
                <span>{isCompiling ? 'Combining...' : 'Combine ready clips'}</span>
              </button>
            </div>

            {finalVideo?.outputUrl && (
              <div className="final-video-panel">
                <strong>Final video</strong>
                <video className="generated-video" controls src={finalVideo.outputUrl} />
                <a className="download-link" href={finalVideo.outputUrl} download>
                  Download MP4
                </a>
              </div>
            )}

            {musicTrack?.outputUrl && (
              <div className="final-video-panel">
                <strong>Lyria music track</strong>
                <audio controls src={musicTrack.outputUrl} />
                <small>Used as the continuous soundtrack when combining clips.</small>
              </div>
            )}

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
