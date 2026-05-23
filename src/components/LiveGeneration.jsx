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
  applyAgentImprovements,
  compileVideo,
  createLivePlan,
  createLyriaPlan,
  createLyriaTrack,
  getManagedAgents,
  getVideoJob,
  runManagedAgentRole,
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

function agentDeskPassed(result) {
  return Boolean(result?.aggregate && Number(result.aggregate.blocked || 0) === 0);
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

function AgentWorkerAnimation({ roles = [] }) {
  const workers = roles.slice(0, 7);
  return (
    <div className="agent-workers" aria-label="Managed agents working">
      {workers.map((role, index) => (
        <div key={role.id || index} className="agent-worker" style={{ '--delay': `${index * 110}ms` }}>
          <span>{role.name?.split(' ')[0] || 'Agent'}</span>
          <i />
        </div>
      ))}
    </div>
  );
}

function AgentProgressList({ roles = [], progress, results = [] }) {
  const resultByRole = new Map(results.map((item) => [item.role.id, item]));
  const completedRoleIds = new Set(progress?.completedRoleIds || []);
  const currentRoleId = progress?.currentRoleId;

  return (
    <div className="agent-progress-list">
      {roles.map((role) => {
        const item = resultByRole.get(role.id);
        const resultStatus = item?.result?.status;
        const isWorking = role.id === currentRoleId;
        const isDone = completedRoleIds.has(role.id) || Boolean(item);
        const status = isWorking ? 'working' : resultStatus || (isDone ? 'done' : 'queued');
        const label = isWorking ? 'Working' : resultStatus || (isDone ? 'Done' : 'Queued');

        return (
          <div key={role.id} className={`agent-progress-row ${status}`}>
            <span>{role.name}</span>
            <b>{label}</b>
          </div>
        );
      })}
    </div>
  );
}

function buildAgentProgressReview({ roles, results, status = 'running' }) {
  const aggregate = {
    pass: results.filter((item) => item.result.status === 'pass').length,
    warn: results.filter((item) => item.result.status === 'warn').length,
    blocked: results.filter((item) => item.result.status === 'blocked').length,
    averageScore: Math.round(results.reduce((sum, item) => sum + Number(item.result.score || 0), 0) / Math.max(results.length, 1))
  };

  return {
    ok: true,
    status,
    count: results.length,
    total: roles.length,
    aggregate,
    results
  };
}

function AudioLane({ lyriaPlan, musicTrack, isMakingLyriaPlan, isGeneratingMusicTrack }) {
  const cueStatus = isMakingLyriaPlan ? 'Planning' : lyriaPlan ? 'Ready' : 'Not planned';
  const trackStatus = isGeneratingMusicTrack ? 'Generating' : musicTrack ? 'Ready' : 'Not generated';

  return (
    <section className="audio-lane">
      <div className="audio-lane-header">
        <span>Lyria Music Track</span>
        <strong>{musicTrack ? 'Separate audio ready' : 'Separate audio lane'}</strong>
      </div>
      <p>Lyria generates one continuous music bed separately from the Veo clips. Final combine uses that track across both scenes so the video does not restart the music per clip.</p>
      <div className="audio-step-row">
        <div className="audio-step ready">
          <span>Scene plan</span>
          <b>Ready</b>
        </div>
        <div className={`audio-step ${lyriaPlan ? 'ready' : isMakingLyriaPlan ? 'working' : ''}`}>
          <span>Music cues</span>
          <b>{cueStatus}</b>
        </div>
        <div className={`audio-step ${musicTrack ? 'ready' : isGeneratingMusicTrack ? 'working' : ''}`}>
          <span>Lyria track</span>
          <b>{trackStatus}</b>
        </div>
      </div>
    </section>
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
  const [agentProgress, setAgentProgress] = useState(null);
  const [jobs, setJobs] = useState({});
  const [finalVideo, setFinalVideo] = useState(null);
  const [autoCompile, setAutoCompile] = useState(false);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [isMakingLyriaPlan, setIsMakingLyriaPlan] = useState(false);
  const [isGeneratingMusicTrack, setIsGeneratingMusicTrack] = useState(false);
  const [isRunningSwarm, setIsRunningSwarm] = useState(false);
  const [isApplyingAgentImprovements, setIsApplyingAgentImprovements] = useState(false);
  const [agentImprovement, setAgentImprovement] = useState(null);
  const [agentRecommendationsDismissed, setAgentRecommendationsDismissed] = useState(false);
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
  const agentReady = agentDeskPassed(swarmResult);
  const agentBlocked = Number(swarmResult?.aggregate?.blocked || 0) > 0;
  const agentReviewRoles = useMemo(() => managedAgents.length ? managedAgents : [], [managedAgents]);

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

  const runAgentDesk = useCallback(async ({ targetPlan, targetProjectId }) => {
    let roles = agentReviewRoles;
    if (roles.length === 0) {
      const response = await getManagedAgents();
      roles = response.roles || [];
      setManagedAgents(roles);
    }

    if (!targetPlan || roles.length === 0) {
      throw new Error('Managed-agent roles are still loading. Try again in a moment.');
    }

    setIsRunningSwarm(true);
    setError('');
    setSwarmResult(null);
    setAgentProgress({ currentRoleId: roles[0]?.id || null, completedRoleIds: [], total: roles.length });

    let results = [];
    try {
      for (const role of roles) {
        setAgentProgress({
          currentRoleId: role.id,
          completedRoleIds: results.map((item) => item.role.id),
          total: roles.length
        });
        const response = await runManagedAgentRole({
          brief,
          lyrics,
          plan: targetPlan,
          projectId: targetProjectId,
          roleId: role.id,
          priorResults: results
        });
        results = response.review?.results || [...results, response.result];
        setSwarmResult(buildAgentProgressReview({ roles, results }));
      }

      const finalReview = buildAgentProgressReview({ roles, results, status: 'completed' });
      setSwarmResult(finalReview);
      setAgentProgress({ currentRoleId: null, completedRoleIds: roles.map((role) => role.id), total: roles.length });
      return finalReview;
    } finally {
      setIsRunningSwarm(false);
    }
  }, [agentReviewRoles, brief, lyrics]);

  const handleCreatePlan = async (event) => {
    event.preventDefault();
    setError('');
    setPlanResponse(null);
    setProjectId(null);
    setLyriaPlan(null);
    setMusicTrack(null);
    setSwarmResult(null);
    setAgentProgress(null);
    setAgentImprovement(null);
    setAgentRecommendationsDismissed(false);
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
      const nextProjectId = response.projectId || response.project?.id || null;
      setProjectId(nextProjectId);
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

  const handleRegenerateAgentDesk = async () => {
    if (!plan) return;
    setAgentRecommendationsDismissed(false);
    try {
      await runAgentDesk({ targetPlan: plan, targetProjectId: projectId });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApplyAgentImprovements = async () => {
    if (!plan || !swarmResult?.results?.length) return;
    setError('');
    setIsApplyingAgentImprovements(true);

    try {
      const response = await applyAgentImprovements({
        brief,
        lyrics,
        plan,
        projectId,
        agentReview: swarmResult
      });
      setPlanResponse((prev) => ({
        ...(prev || {}),
        plan: response.plan,
        project: response.project || prev?.project
      }));
      setAgentImprovement(response.improvement);
      setAgentRecommendationsDismissed(false);
      setSwarmResult(null);
      setAgentProgress(null);
      setLyriaPlan(null);
      setMusicTrack(null);
      setJobs({});
      setFinalVideo(null);
      setAutoCompile(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsApplyingAgentImprovements(false);
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
                <strong>{managedAgents.length || 4}</strong>
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

              <button className="btn-primary" onClick={handleRegenerateAgentDesk} disabled={isRunningSwarm}>
                {isRunningSwarm ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
                <span>{isRunningSwarm ? 'Agents reviewing...' : 'Run Managed Agent Production Desk'}</span>
              </button>
            </div>

            <AudioLane
              lyriaPlan={lyriaPlan}
              musicTrack={musicTrack}
              isMakingLyriaPlan={isMakingLyriaPlan}
              isGeneratingMusicTrack={isGeneratingMusicTrack}
            />

            <section className={`agent-desk ${agentReady ? 'ready' : agentBlocked ? 'blocked' : 'pending'}`}>
              <div className="agent-desk-header">
                <div>
                  <span>Gemini Managed Agents</span>
                  <strong>Production Desk</strong>
                </div>
                <b>
                  {isRunningSwarm
                    ? `${swarmResult?.count || 0}/${agentReviewRoles.length || managedAgents.length || 4}`
                    : agentReady ? 'Reviewed' : agentBlocked ? 'Needs attention' : 'Optional'}
                </b>
              </div>
              <p>Omnidesk uses Gemini Managed Agents as an optional production desk. Specialist agents review the creator brief, lyrics, assets, IP safety, music continuity, Veo prompts, and edit readiness, then can suggest improvements without blocking generation.</p>
              {isRunningSwarm && <AgentWorkerAnimation roles={managedAgents} />}
              {(isRunningSwarm || swarmResult) && agentReviewRoles.length > 0 && (
                <AgentProgressList
                  roles={agentReviewRoles}
                  progress={agentProgress}
                  results={swarmResult?.results || []}
                />
              )}
              {swarmResult?.aggregate && (
                <div className="swarm-metrics">
                  <div><strong>{swarmResult.aggregate.pass}</strong><span>Pass</span></div>
                  <div><strong>{swarmResult.aggregate.warn}</strong><span>Warn</span></div>
                  <div><strong>{swarmResult.aggregate.blocked}</strong><span>Block</span></div>
                </div>
              )}
              {!agentReady && !isRunningSwarm && (
                <small>{swarmResult ? 'Review found issues, but generation remains available. Apply improvements or continue with the current plan.' : 'Run this desk manually when you want agent review. Generation remains available without it.'}</small>
              )}
            </section>

            {swarmResult && !agentRecommendationsDismissed && (
              <section className="agent-improvement-panel">
                <div>
                  <span>Optional agent edits</span>
                  <strong>Improve this plan from recommendations</strong>
                  <small>Applies the four agents' findings to the scene plan, Veo prompts, safety notes, and music direction. You can ignore this and use the current plan.</small>
                </div>
                <div className="action-row">
                  <button className="btn-primary" onClick={handleApplyAgentImprovements} disabled={isApplyingAgentImprovements || isRunningSwarm}>
                    {isApplyingAgentImprovements ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
                    <span>{isApplyingAgentImprovements ? 'Applying edits...' : 'Apply agent improvements'}</span>
                  </button>
                  <button className="btn-secondary" onClick={() => setAgentRecommendationsDismissed(true)} disabled={isApplyingAgentImprovements}>
                    Ignore
                  </button>
                </div>
              </section>
            )}

            {agentImprovement && (
              <section className="agent-improvement-panel ready">
                <div>
                  <span>Agent edits applied</span>
                  <strong>{agentImprovement.summary || 'Plan updated from managed-agent recommendations.'}</strong>
                  <small>Run the Managed Agent Production Desk again to review the updated plan before generation.</small>
                </div>
                {agentImprovement.changeLog?.length > 0 && (
                  <div className="agent-change-log">
                    {agentImprovement.changeLog.map((entry, index) => (
                      <details key={`${entry.agentName || 'agent'}-${index}`} className="result-details">
                        <summary>
                          <span>{entry.agentName || 'Agent'}</span>
                          <b>{entry.changes?.length || 0} edits</b>
                        </summary>
                        <ul>
                          {(entry.changes || []).map((change, changeIndex) => (
                            <li key={`${change}-${changeIndex}`}>{change}</li>
                          ))}
                        </ul>
                      </details>
                    ))}
                  </div>
                )}
              </section>
            )}

            <div className="render-panel">
              <div>
                <span>Final render</span>
                <strong>{completedClipCount}/{scenes.length} clips ready</strong>
                <small>Generate all runs one Veo clip at a time. The default 16-second render uses two 8-second Veo clips. Managed-agent review is optional.</small>
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
        </div>
      )}
    </div>
  );
}
