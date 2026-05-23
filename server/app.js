import 'dotenv/config';
import crypto from 'node:crypto';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import mime from 'mime-types';
import ffmpegPath from 'ffmpeg-static';
import { list, put } from '@vercel/blob';
import {
  GoogleGenAI,
  GenerateVideosOperation,
  createPartFromUri,
  createUserContent
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeDir = process.env.VERCEL ? '/tmp/omnidesk' : __dirname;
const uploadDir = path.join(runtimeDir, 'uploads');
const generatedDir = path.join(runtimeDir, 'generated');
const dataDir = path.join(runtimeDir, 'data');
const localProjectsDir = path.join(dataDir, 'projects');
const localJobsDir = path.join(dataDir, 'jobs');

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(generatedDir, { recursive: true });
await fs.mkdir(localProjectsDir, { recursive: true });
await fs.mkdir(localJobsDir, { recursive: true });

const app = express();
const upload = multer({ dest: uploadDir, limits: { fileSize: 80 * 1024 * 1024 } });

const plannerModel = process.env.GEMINI_PLANNER_MODEL || 'gemini-3-flash-preview';
const videoModel = process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-generate-preview';
const managedAgent = process.env.GEMINI_MANAGED_AGENT || 'antigravity-preview-05-2026';
const lyriaModel = process.env.GEMINI_LYRIA_MODEL || 'lyria-3-clip-preview';
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const videoJobs = new Map();
const GEMINI_FILE_ACTIVE_TIMEOUT_MS = Number(process.env.GEMINI_FILE_ACTIVE_TIMEOUT_MS || 45_000);
const GEMINI_FILE_POLL_INTERVAL_MS = Number(process.env.GEMINI_FILE_POLL_INTERVAL_MS || 2_000);
const usesBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);

const MANAGED_AGENT_ROLES = [
  {
    id: 'music-analyst',
    name: 'Music Analyst Agent',
    mission: 'Analyze the music-video timing, section map, energy curve, beat-sync opportunities, and audio risks.'
  },
  {
    id: 'creator-dna',
    name: 'Creator DNA Agent',
    mission: 'Inspect how well uploaded assets, choreography, wardrobe, references, motifs, and personal style are reflected in the plan.'
  },
  {
    id: 'creative-director',
    name: 'Creative Director Agent',
    mission: 'Strengthen the concept, visual language, story arc, emotional progression, and originality of the one-minute video.'
  },
  {
    id: 'scene-planner',
    name: 'Scene Planner Agent',
    mission: 'Verify the 10-scene structure, pacing, transitions, scene contrast, and complete 60-second coverage.'
  },
  {
    id: 'continuity-supervisor',
    name: 'Continuity Supervisor Agent',
    mission: 'Check cross-scene consistency for subject, wardrobe, movement, color palette, props, locations, and motifs.'
  },
  {
    id: 'ip-safety',
    name: 'IP Safety Agent',
    mission: 'Identify copyright, trademark, celebrity likeness, artist-style imitation, music-rights, and platform-safety risks.'
  },
  {
    id: 'prompt-engineer',
    name: 'Veo Prompt Engineer Agent',
    mission: 'Improve every Veo prompt for clear subject, action, camera, lighting, style, duration, and negative constraints.'
  },
  {
    id: 'generation-router',
    name: 'Generation Router Agent',
    mission: 'Decide which scenes should be generated first, which need still/keyframe fallback, and what settings reduce latency risk.'
  },
  {
    id: 'audio-producer',
    name: 'Lyria Audio Producer Agent',
    mission: 'Create a safe music-control strategy for intros, drops, transitions, stingers, and section-level musical variations.'
  },
  {
    id: 'editor',
    name: 'Editor Agent',
    mission: 'Plan assembly, beat cuts, match cuts, captions, transitions, preview order, and final export structure.'
  },
  {
    id: 'remix',
    name: 'Remix Agent',
    mission: 'Define remixable controls, lock rules, branch strategy, and examples for changing style while preserving continuity.'
  },
  {
    id: 'qa-showrunner',
    name: 'Demo QA Showrunner Agent',
    mission: 'Find demo failure modes and produce a reliable 3-minute judging flow with fallback assets and talking points.'
  }
];

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/api/outputs', express.static(generatedDir));

function assertConfigured() {
  if (!ai) {
    const err = new Error('Missing GEMINI_API_KEY. Add your AI Studio key to .env and restart the server.');
    err.status = 401;
    throw err;
  }
}

function cleanJson(text) {
  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function extractInteractionText(interaction) {
  if (interaction.output_text) return interaction.output_text;
  if (interaction.outputText) return interaction.outputText;
  if (typeof interaction.outputs === 'string') return interaction.outputs;
  if (Array.isArray(interaction.outputs)) {
    return interaction.outputs.map((output) => {
      if (typeof output === 'string') return output;
      if (output.text) return output.text;
      if (output.content) return typeof output.content === 'string' ? output.content : JSON.stringify(output.content);
      return JSON.stringify(output);
    }).join('\n');
  }
  return JSON.stringify(interaction.outputs || interaction, null, 2);
}

function normalizeError(err) {
  const fallback = {
    status: err.status || err.statusCode || 500,
    message: err.message || 'Unexpected server error.',
    code: err.code || null
  };

  if (typeof err.message === 'string' && err.message.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(err.message);
      if (parsed.error) {
        return {
          status: parsed.error.code || fallback.status,
          message: parsed.error.message || fallback.message,
          code: parsed.error.status || fallback.code
        };
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function hydrateVideoOperation(job) {
  if (job.operation?._fromAPIResponse) return job.operation;
  const operation = new GenerateVideosOperation();
  Object.assign(operation, job.operation || {});
  operation.name = operation.name || job.operationName;
  return operation;
}

function publicProject(record) {
  return {
    id: record.id,
    title: record.title,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    brief: record.brief,
    format: record.targetFormat,
    durationSeconds: record.durationSeconds,
    sceneCount: record.sceneCount,
    models: record.models,
    plan: record.plan,
    clips: record.clips || [],
    finalVideo: record.finalVideo || null,
    audioPlan: record.audioPlan || null,
    musicTrack: record.musicTrack || null,
    agentReview: record.agentReview || null,
    uploadedAssets: record.uploadedAssets || [],
    lyrics: record.lyrics || '',
    reactions: {
      loves: Number(record.reactions?.loves || 0)
    },
    comments: record.comments || []
  };
}

function localProjectPath(projectId) {
  return path.join(localProjectsDir, `${projectId}.json`);
}

function localJobPath(jobId) {
  return path.join(localJobsDir, `${jobId}.json`);
}

function blobJsonUrl(blob) {
  const source = blob.downloadUrl || blob.url;
  const separator = source.includes('?') ? '&' : '?';
  return `${source}${separator}t=${Date.now()}`;
}

async function saveProjectRecord(record) {
  const updatedRecord = {
    ...record,
    updatedAt: new Date().toISOString()
  };

  if (usesBlobStorage) {
    await put(
      `omnidesk/projects/${updatedRecord.id}/record.json`,
      JSON.stringify(updatedRecord, null, 2),
      {
        access: 'public',
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      }
    );
    return updatedRecord;
  }

  await fs.writeFile(localProjectPath(updatedRecord.id), JSON.stringify(updatedRecord, null, 2));
  return updatedRecord;
}

async function saveVideoJobRecord(job) {
  const updatedJob = {
    ...job,
    updatedAt: new Date().toISOString()
  };

  if (usesBlobStorage) {
    await put(
      `omnidesk/jobs/${updatedJob.id}.json`,
      JSON.stringify(updatedJob, null, 2),
      {
        access: 'public',
        allowOverwrite: true,
        contentType: 'application/json',
        cacheControlMaxAge: 0
      }
    );
    return updatedJob;
  }

  await fs.writeFile(localJobPath(updatedJob.id), JSON.stringify(updatedJob, null, 2));
  return updatedJob;
}

async function getProjectRecord(projectId) {
  if (!projectId) return null;

  if (usesBlobStorage) {
    const listed = await list({ prefix: `omnidesk/projects/${projectId}/record.json`, limit: 1 });
    const recordBlob = listed.blobs.find((blob) => blob.pathname.endsWith('/record.json'));
    if (!recordBlob) return null;
    const response = await fetch(blobJsonUrl(recordBlob), { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  }

  try {
    return JSON.parse(await fs.readFile(localProjectPath(projectId), 'utf8'));
  } catch {
    return null;
  }
}

async function getVideoJobRecord(jobId) {
  if (!jobId) return null;

  if (usesBlobStorage) {
    const listed = await list({ prefix: `omnidesk/jobs/${jobId}.json`, limit: 1 });
    const jobBlob = listed.blobs.find((blob) => blob.pathname.endsWith(`${jobId}.json`));
    if (!jobBlob) return null;
    const response = await fetch(blobJsonUrl(jobBlob), { cache: 'no-store' });
    if (!response.ok) return null;
    return response.json();
  }

  try {
    return JSON.parse(await fs.readFile(localJobPath(jobId), 'utf8'));
  } catch {
    return null;
  }
}

async function updateProjectRecord(projectId, updater) {
  const existing = await getProjectRecord(projectId);
  if (!existing) return null;
  return saveProjectRecord(updater(existing));
}

async function listProjectRecords() {
  if (usesBlobStorage) {
    const listed = await list({ prefix: 'omnidesk/projects/', limit: 1000 });
    const recordBlobs = listed.blobs
      .filter((blob) => blob.pathname.endsWith('/record.json'))
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    const records = await Promise.all(recordBlobs.map(async (blob) => {
      try {
        const response = await fetch(blobJsonUrl(blob), { cache: 'no-store' });
        return response.ok ? response.json() : null;
      } catch {
        return null;
      }
    }));
    return records.filter(Boolean);
  }

  const names = await fs.readdir(localProjectsDir).catch(() => []);
  const records = await Promise.all(names
    .filter((name) => name.endsWith('.json'))
    .map(async (name) => {
      try {
        return JSON.parse(await fs.readFile(path.join(localProjectsDir, name), 'utf8'));
      } catch {
        return null;
      }
    }));
  return records.filter(Boolean).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

async function storeMediaFile({ localPath, pathname, contentType = 'video/mp4' }) {
  if (!usesBlobStorage) {
    return {
      url: `/api/outputs/${path.basename(localPath)}`,
      storage: 'local'
    };
  }

  const blob = await put(pathname, createReadStream(localPath), {
    access: 'public',
    allowOverwrite: true,
    contentType,
    addRandomSuffix: false,
    multipart: true,
    cacheControlMaxAge: 60 * 60 * 24 * 30
  });

  return {
    url: blob.url,
    downloadUrl: blob.downloadUrl,
    pathname: blob.pathname,
    storage: 'vercel-blob'
  };
}

async function ensureClipLocalFile(clip, index) {
  const outputUrl = String(clip.outputUrl || '');
  if (outputUrl.startsWith('/api/outputs/')) {
    return path.join(generatedDir, path.basename(outputUrl));
  }

  if (!/^https?:\/\//.test(outputUrl)) {
    throw new Error(`Clip ${clip.sceneId || index + 1} has no usable output URL.`);
  }

  const response = await fetch(outputUrl);
  if (!response.ok) {
    throw new Error(`Could not download clip ${clip.sceneId || index + 1} for compilation.`);
  }

  const localPath = path.join(generatedDir, `compile-input-${crypto.randomUUID()}-${index}.mp4`);
  await fs.writeFile(localPath, Buffer.from(await response.arrayBuffer()));
  return localPath;
}

async function ensureAudioLocalFile(audio) {
  const outputUrl = String(audio?.outputUrl || '');
  if (!outputUrl) return null;

  if (outputUrl.startsWith('/api/outputs/')) {
    return path.join(generatedDir, path.basename(outputUrl));
  }

  if (!/^https?:\/\//.test(outputUrl)) {
    throw new Error('Music track has no usable output URL.');
  }

  const response = await fetch(outputUrl);
  if (!response.ok) {
    throw new Error('Could not download music track for compilation.');
  }

  const extension = mime.extension(audio.contentType || 'audio/mpeg') || 'mp3';
  const localPath = path.join(generatedDir, `compile-audio-${crypto.randomUUID()}.${extension}`);
  await fs.writeFile(localPath, Buffer.from(await response.arrayBuffer()));
  return localPath;
}

async function syncCompletedJobToProject(job) {
  if (!job.projectId || !job.outputUrl) return;

  await updateProjectRecord(job.projectId, (record) => {
    const clips = (record.clips || []).filter((clip) => clip.sceneId !== job.sceneId);
    clips.push({
      sceneId: job.sceneId,
      title: job.sceneTitle || job.sceneId,
      outputUrl: job.outputUrl,
      downloadUrl: job.downloadUrl,
      storage: job.storage,
      model: job.model,
      prompt: job.prompt,
      completedAt: job.completedAt
    });
    clips.sort((a, b) => String(a.sceneId).localeCompare(String(b.sceneId)));
    return {
      ...record,
      status: record.finalVideo ? 'completed' : 'clips-generating',
      clips
    };
  });
}

async function runManagedRole({ role, brief, lyrics, plan }) {
  const input = `You are the ${role.name} for Omnidesk, a live music-video generation product.

Mission:
${role.mission}

Review this production plan and return concise JSON only:
{
  "agentId": "${role.id}",
  "agentName": "${role.name}",
  "status": "pass|warn|blocked",
  "score": number,
  "findings": string[],
  "requiredChanges": string[],
  "sceneNotes": [{"sceneId": string, "note": string}],
  "nextAction": string
}

Creator brief:
${brief || ''}

Creator lyrics:
${lyrics || ''}

Production plan:
${JSON.stringify(plan || {}, null, 2)}`;

  const interaction = await ai.interactions.create({
    agent: managedAgent,
    input
  });

  const text = extractInteractionText(interaction);
  let parsed;
  try {
    parsed = JSON.parse(cleanJson(text));
  } catch {
    parsed = {
      agentId: role.id,
      agentName: role.name,
      status: 'warn',
      score: 0,
      findings: [text],
      requiredChanges: ['Review unstructured managed-agent output manually.'],
      sceneNotes: [],
      nextAction: 'Parse failed; inspect raw output.'
    };
  }

  return {
    role,
    interactionId: interaction.id,
    status: interaction.status || 'completed',
    outputText: text,
    result: parsed
  };
}

function buildAgentAggregate(results) {
  return {
    pass: results.filter((item) => item.result.status === 'pass').length,
    warn: results.filter((item) => item.result.status === 'warn').length,
    blocked: results.filter((item) => item.result.status === 'blocked').length,
    averageScore: Math.round(results.reduce((sum, item) => sum + Number(item.result.score || 0), 0) / Math.max(results.length, 1))
  };
}

async function updateAgentReviewRecord(projectId, review) {
  if (!projectId) return null;
  return updateProjectRecord(projectId, (record) => ({
    ...record,
    agentReview: review
  }));
}

function pickMime(file) {
  return file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream';
}

async function uploadToGemini(file) {
  const mimeType = pickMime(file);
  const uploaded = await ai.files.upload({
    file: file.path,
    config: {
      mimeType,
      displayName: file.originalname
    }
  });
  const activeFile = await waitForGeminiFileActive(uploaded, file.originalname);

  return {
    originalName: file.originalname,
    mimeType,
    name: activeFile.name,
    state: activeFile.state,
    uri: activeFile.uri
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForGeminiFileActive(uploaded, originalName) {
  if (!uploaded?.name) {
    throw new Error(`Gemini upload did not return a file name for ${originalName}.`);
  }

  let current = uploaded;
  const startedAt = Date.now();

  while (current.state && current.state !== 'ACTIVE') {
    if (current.state === 'FAILED') {
      const reason = current.error?.message || JSON.stringify(current.error || {});
      throw new Error(`Gemini could not process ${originalName}. ${reason}`.trim());
    }

    if (Date.now() - startedAt > GEMINI_FILE_ACTIVE_TIMEOUT_MS) {
      throw new Error(`${originalName} is still processing in Gemini Files API. Try a shorter clip, smaller file, or retry in a moment.`);
    }

    await sleep(GEMINI_FILE_POLL_INTERVAL_MS);
    current = await ai.files.get({ name: uploaded.name });
  }

  return current;
}

function productionPrompt({ brief, targetFormat, durationSeconds, sceneCount, constraints, lyrics }, uploadedFiles) {
  const targetDuration = Number(durationSeconds || 16);
  const targetSceneCount = Number(sceneCount || 2);
  const narrativeSceneDuration = Math.max(4, Math.round(targetDuration / targetSceneCount));
  const generatedClipDuration = Math.min(8, Math.max(4, narrativeSceneDuration));
  const assetSummary = uploadedFiles.map((file, index) => (
    `${index + 1}. ${file.originalName} (${file.mimeType})`
  )).join('\n');

  return `You are Omnidesk, a managed-agent music video production desk.

Create a live production plan from the creator brief and uploaded assets. Return valid JSON only. No markdown.

Creator brief:
${brief || 'Create an original, rights-safe music video from the uploaded creator assets.'}

Target format: ${targetFormat || '9:16'}
Target total duration seconds: ${targetDuration}
Target scene count: ${targetSceneCount}
Narrative duration per scene: about ${narrativeSceneDuration} seconds
Generated Veo clip duration per scene: ${generatedClipDuration} seconds
Creator constraints:
${constraints || 'Original, rights-safe, no named franchise or artist imitation.'}

Lyrics or music text:
${lyrics?.trim() || 'No pasted lyrics. Infer a rights-safe instrumental or vocal direction from the brief.'}

Uploaded assets:
${assetSummary || 'No assets uploaded.'}

Return this JSON shape:
{
  "title": "short project title",
  "format": "9:16 or 16:9 or 1:1",
  "durationSeconds": number,
  "musicAnalysis": {
    "bpmEstimate": number | null,
    "unifiedTrackDirection": string,
    "sections": [{"label": "intro|verse|chorus|bridge|outro|drop|other", "startSec": number, "endSec": number, "mood": string, "energy": number}]
  },
  "creatorDna": {
    "movement": string,
    "palette": string[],
    "wardrobe": string,
    "locations": string,
    "motifs": string[]
  },
  "styleBible": {
    "logline": string,
    "visualLanguage": string,
    "cameraLanguage": string[],
    "negativeConstraints": string[]
  },
  "safetyReport": {
    "status": "pass|warn|blocked",
    "ipRisks": string[],
    "rewrittenTerms": [{"original": string, "replacement": string, "reason": string}],
    "originalityScore": number,
    "recommendations": string[]
  },
  "scenes": [
    {
      "id": "scene_01",
      "title": string,
      "startSec": number,
      "endSec": number,
      "description": string,
      "veoPrompt": "A complete, rights-safe prompt for Veo 3.1. Include camera, movement, lighting, subject, setting, and audio/sound direction.",
      "negativePrompt": string,
      "recommendedModel": "veo-3.1-generate-preview",
      "aspectRatio": "9:16|16:9",
      "durationSeconds": ${generatedClipDuration}
    }
  ]
}

Rules:
- Avoid named artists, celebrity likenesses, copyrighted characters, protected logos, and franchise lookalikes.
- If the user asks for risky IP, rewrite it into original descriptive language.
- Return exactly ${targetSceneCount} scenes for a ${targetDuration}-second music video.
- Each scene covers roughly ${narrativeSceneDuration} seconds of the music-video arc, but each Veo generation must use durationSeconds between 4 and 8 inclusive.
- Set every scene.durationSeconds to ${generatedClipDuration}; do not output a value above 8.
- Use scene IDs scene_01 through scene_${String(targetSceneCount).padStart(2, '0')}.
- Keep one continuous music track across the full ${targetDuration} seconds. Do not create a separate song, vocal take, or beat per scene.
- Treat scenes as visual chapters under one shared track. The first scene should establish hook/verse energy; the last scene should land the chorus/climax/outro.
- If uploaded dance video is present, preserve movement timing conceptually without impersonating identity unless consent is clear.
- Make every scene high-impact enough to demo on its own.`;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(ai),
    plannerModel,
    videoModel,
    lyriaModel,
    managedAgent,
    managedAgentCount: MANAGED_AGENT_ROLES.length,
    storage: usesBlobStorage ? 'vercel blob' : 'local filesystem',
    note: ai
      ? 'Gemini API key is configured.'
      : 'Set GEMINI_API_KEY in .env to enable live generation.'
  });
});

app.get('/api/discover', async (_req, res, next) => {
  try {
    const records = await listProjectRecords();
    const playableRecords = records.filter((record) => record.finalVideo?.outputUrl || record.clips?.some((clip) => clip.outputUrl));
    res.json({
      ok: true,
      storage: usesBlobStorage ? 'vercel-blob' : 'local',
      projects: playableRecords.map(publicProject)
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/discover/:projectId/love', async (req, res, next) => {
  try {
    const updated = await updateProjectRecord(req.params.projectId, (record) => ({
      ...record,
      reactions: {
        ...record.reactions,
        loves: Number(record.reactions?.loves || 0) + 1
      }
    }));

    if (!updated) {
      res.status(404).json({ ok: false, error: 'Project not found.' });
      return;
    }

    res.json({ ok: true, project: publicProject(updated) });
  } catch (err) {
    next(err);
  }
});

app.post('/api/discover/:projectId/comments', async (req, res, next) => {
  try {
    const body = String(req.body?.body || '').trim();
    const author = String(req.body?.author || '').trim().slice(0, 40) || 'Guest';

    if (!body) {
      res.status(400).json({ ok: false, error: 'Comment cannot be empty.' });
      return;
    }

    const updated = await updateProjectRecord(req.params.projectId, (record) => ({
      ...record,
      comments: [
        {
          id: crypto.randomUUID(),
          author,
          body: body.slice(0, 500),
          createdAt: new Date().toISOString()
        },
        ...(record.comments || [])
      ].slice(0, 50)
    }));

    if (!updated) {
      res.status(404).json({ ok: false, error: 'Project not found.' });
      return;
    }

    res.json({ ok: true, project: publicProject(updated) });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/plan', upload.array('assets', 8), async (req, res, next) => {
  try {
    assertConfigured();
    const uploadedFiles = [];
    for (const file of req.files || []) {
      uploadedFiles.push(await uploadToGemini(file));
    }

    const prompt = productionPrompt(req.body, uploadedFiles);
    const parts = [prompt];
    for (const file of uploadedFiles) {
      parts.push(createPartFromUri(file.uri, file.mimeType));
    }

    const response = await ai.models.generateContent({
      model: plannerModel,
      contents: createUserContent(parts),
      config: {
        responseMimeType: 'application/json'
      }
    });

    const plan = JSON.parse(cleanJson(response.text || '{}'));
    const projectId = crypto.randomUUID();
    const record = await saveProjectRecord({
      id: projectId,
      status: 'planned',
      visibility: 'public',
      title: plan.title || 'Untitled Omnidesk Video',
      brief: req.body.brief || '',
      lyrics: req.body.lyrics || '',
      targetFormat: req.body.targetFormat || plan.format || '9:16',
      durationSeconds: Number(req.body.durationSeconds || plan.durationSeconds || 16),
      sceneCount: Number(req.body.sceneCount || plan.scenes?.length || 2),
      createdAt: new Date().toISOString(),
      models: {
        planner: plannerModel,
        video: videoModel,
        lyria: lyriaModel,
        managedAgent
      },
      uploadedAssets: uploadedFiles.map((file) => ({
        originalName: file.originalName,
        mimeType: file.mimeType,
        geminiFile: file.name,
        state: file.state
      })),
      plan,
      clips: [],
      finalVideo: null,
      audioPlan: null,
      musicTrack: null,
      agentReview: null,
      reactions: { loves: 0 },
      comments: []
    });

    res.json({
      ok: true,
      projectId,
      model: plannerModel,
      uploadedAssets: uploadedFiles,
      plan,
      project: publicProject(record)
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/videos', async (req, res, next) => {
  try {
    assertConfigured();
    const {
      projectId,
      sceneId,
      sceneTitle,
      prompt,
      negativePrompt,
      aspectRatio = '9:16',
      durationSeconds = 8,
      resolution = '720p'
    } = req.body;

    if (!prompt?.trim()) {
      res.status(400).json({ ok: false, error: 'Missing prompt.' });
      return;
    }

    const requestedDurationSeconds = Number(durationSeconds || 8);
    if (!Number.isFinite(requestedDurationSeconds) || requestedDurationSeconds <= 0) {
      res.status(400).json({ ok: false, error: 'durationSeconds must be a positive number.' });
      return;
    }
    const clipDurationSeconds = Math.min(8, Math.max(4, requestedDurationSeconds));

    const operation = await ai.models.generateVideos({
      model: videoModel,
      prompt,
      config: {
        aspectRatio,
        durationSeconds: clipDurationSeconds,
        resolution,
        negativePrompt: negativePrompt || undefined
      }
    });

    const jobId = crypto.randomUUID();
    const job = await saveVideoJobRecord({
      id: jobId,
      projectId,
      sceneId: sceneId || 'scene',
      sceneTitle,
      operation,
      operationName: operation.name || null,
      prompt,
      model: videoModel,
      status: 'running',
      createdAt: new Date().toISOString(),
      outputPath: null,
      outputUrl: null
    });
    videoJobs.set(jobId, job);

    res.json({
      ok: true,
      jobId,
      projectId,
      sceneId,
      model: videoModel,
      operationName: job.operationName,
      status: 'running'
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/live/videos/:jobId', async (req, res, next) => {
  try {
    assertConfigured();
    const job = videoJobs.get(req.params.jobId) || await getVideoJobRecord(req.params.jobId);
    if (!job) {
      res.status(404).json({ ok: false, error: 'Unknown video job.' });
      return;
    }

    if (job.status === 'completed') {
      await syncCompletedJobToProject(job);
      res.json({ ok: true, ...job });
      return;
    }

    job.operation = await ai.operations.getVideosOperation({ operation: hydrateVideoOperation(job) });
    job.operationName = job.operation.name || job.operationName || null;

    if (!job.operation.done) {
      job.status = 'running';
      job.lastCheckedAt = new Date().toISOString();
      await saveVideoJobRecord(job);
      videoJobs.set(job.id, job);
      res.json({
        ok: true,
        id: job.id,
        sceneId: job.sceneId,
        status: 'running',
        model: job.model,
        operationName: job.operation.name || null,
        createdAt: job.createdAt
      });
      return;
    }

    const generatedVideo = job.operation.response?.generatedVideos?.[0];
    if (!generatedVideo?.video) {
      job.status = 'failed';
      job.error = 'Generation completed but no video was returned.';
      await saveVideoJobRecord(job);
      videoJobs.set(job.id, job);
      res.json({ ok: false, ...job });
      return;
    }

    const filename = `${job.sceneId}-${job.id}.mp4`;
    const downloadPath = path.join(generatedDir, filename);
    await ai.files.download({
      file: generatedVideo.video,
      downloadPath
    });
    const stored = await storeMediaFile({
      localPath: downloadPath,
      pathname: `omnidesk/projects/${job.projectId || 'unassigned'}/clips/${filename}`,
      contentType: 'video/mp4'
    });

    job.status = 'completed';
    job.outputPath = downloadPath;
    job.outputUrl = stored.url;
    job.downloadUrl = stored.downloadUrl || stored.url;
    job.storage = stored.storage;
    job.completedAt = new Date().toISOString();
    await saveVideoJobRecord(job);
    videoJobs.set(job.id, job);

    await syncCompletedJobToProject(job);

    res.json({ ok: true, ...job });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/compile', async (req, res, next) => {
  try {
    const { projectId, clips = [], title = 'omnidesk-final', musicTrack = null } = req.body;
    if (!Array.isArray(clips) || clips.length === 0) {
      res.status(400).json({ ok: false, error: 'No completed clips were provided.' });
      return;
    }

    if (!ffmpegPath) {
      res.status(501).json({ ok: false, error: 'Video compilation is not available in this deployment.' });
      return;
    }

    const inputPaths = [];
    for (const [index, clip] of clips.entries()) {
      inputPaths.push(await ensureClipLocalFile(clip, index));
    }

    for (const inputPath of inputPaths) {
      try {
        await fs.access(inputPath);
      } catch {
        res.status(404).json({
          ok: false,
          error: 'One or more generated clips are no longer available. Regenerate the clips, then compile again.'
        });
        return;
      }
    }

    const compileId = crypto.randomUUID();
    const safeTitle = String(title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'omnidesk-final';
    const listPath = path.join(generatedDir, `${compileId}.txt`);
    const outputFilename = `${safeTitle}-${compileId}.mp4`;
    const outputPath = path.join(generatedDir, outputFilename);
    const videoOnlyPath = musicTrack?.outputUrl
      ? path.join(generatedDir, `${safeTitle}-${compileId}-video.mp4`)
      : outputPath;
    const concatList = inputPaths
      .map((inputPath) => `file '${inputPath.replaceAll("'", "'\\''")}'`)
      .join('\n');
    await fs.writeFile(listPath, concatList);

    await runFfmpeg([
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', listPath,
      '-c', 'copy',
      videoOnlyPath
    ]);

    if (musicTrack?.outputUrl) {
      const audioPath = await ensureAudioLocalFile(musicTrack);
      await runFfmpeg([
        '-y',
        '-i', videoOnlyPath,
        '-i', audioPath,
        '-map', '0:v:0',
        '-map', '1:a:0',
        '-c:v', 'copy',
        '-c:a', 'aac',
        '-shortest',
        outputPath
      ]);
    }

    const stored = await storeMediaFile({
      localPath: outputPath,
      pathname: `omnidesk/projects/${projectId || 'unassigned'}/final/${outputFilename}`,
      contentType: 'video/mp4'
    });
    const finalVideo = {
      outputUrl: stored.url,
      downloadUrl: stored.downloadUrl || stored.url,
      storage: stored.storage,
      clipCount: inputPaths.length,
      musicTrack: musicTrack || null,
      completedAt: new Date().toISOString()
    };

    if (projectId) {
      await updateProjectRecord(projectId, (record) => ({
        ...record,
        status: 'completed',
        finalVideo
      }));
    }

    res.json({
      ok: true,
      ...finalVideo,
      clipCount: inputPaths.length
    });
  } catch (err) {
    next(err);
  }
});

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`ffmpeg failed with code ${code}: ${stderr.slice(-1000)}`));
    });
  });
}

app.post('/api/live/lyria-plan', async (req, res, next) => {
  try {
    assertConfigured();
    const { brief, plan, projectId } = req.body;
    const response = await ai.models.generateContent({
      model: plannerModel,
      contents: `Create a rights-safe Lyria RealTime music generation control plan for this music video. Return JSON only.

Brief:
${brief || ''}

Production plan:
${JSON.stringify(plan || {}, null, 2)}

JSON shape:
{
  "weightedPrompts": [{"text": string, "weight": number}],
  "musicGenerationConfig": {"bpm": number, "temperature": number, "guidance": string},
  "sectionSteering": [{"timeSec": number, "weightedPrompts": [{"text": string, "weight": number}]}],
  "rightsSafetyNotes": string[]
}`
    });
    const audioPlan = JSON.parse(cleanJson(response.text || '{}'));
    if (projectId) {
      await updateProjectRecord(projectId, (record) => ({
        ...record,
        audioPlan
      }));
    }
    res.json({ ok: true, model: plannerModel, plan: audioPlan });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/lyria-track', async (req, res, next) => {
  try {
    assertConfigured();
    const { brief, lyrics, plan, projectId, durationSeconds = 16 } = req.body;
    const response = await ai.models.generateContent({
      model: lyriaModel,
      contents: `Create one continuous rights-safe music track for a ${durationSeconds}-second music video.

The track must feel like a single cohesive song bed across every visual scene. Do not create separate cues per scene.

Creative direction:
${brief || ''}

Lyrics or hook:
${lyrics || 'Instrumental only, no intelligible lyrics.'}

Music plan:
${JSON.stringify(plan?.musicAnalysis || {}, null, 2)}

Visual summary:
${plan?.styleBible?.logline || plan?.title || ''}

Return audio plus any concise structure notes. If the model emits a longer clip, the app will trim it to the final video duration.`
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    const textNotes = [];
    let audioData = null;
    let contentType = 'audio/mpeg';

    for (const part of parts) {
      if (part.text) textNotes.push(part.text);
      if (part.inlineData?.data) {
        audioData = Buffer.from(part.inlineData.data, 'base64');
        contentType = part.inlineData.mimeType || contentType;
      }
    }

    if (!audioData) {
      res.status(502).json({ ok: false, error: 'Lyria did not return audio for this prompt.' });
      return;
    }

    const extension = mime.extension(contentType) || 'mp3';
    const filename = `lyria-track-${crypto.randomUUID()}.${extension}`;
    const localPath = path.join(generatedDir, filename);
    await fs.writeFile(localPath, audioData);

    const stored = await storeMediaFile({
      localPath,
      pathname: `omnidesk/projects/${projectId || 'unassigned'}/audio/${filename}`,
      contentType
    });

    const musicTrack = {
      outputUrl: stored.url,
      downloadUrl: stored.downloadUrl || stored.url,
      storage: stored.storage,
      model: lyriaModel,
      contentType,
      notes: textNotes.join('\n\n'),
      durationSeconds: Number(durationSeconds || 16),
      completedAt: new Date().toISOString()
    };

    if (projectId) {
      await updateProjectRecord(projectId, (record) => ({
        ...record,
        musicTrack
      }));
    }

    res.json({ ok: true, musicTrack });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/managed-agent-review', async (req, res, next) => {
  try {
    assertConfigured();
    const { brief, plan, projectId } = req.body;
    if (!ai.interactions?.create) {
      res.status(501).json({
        ok: false,
        error: 'This @google/genai build does not expose interactions.create. Update @google/genai or use the REST Interactions API.'
      });
      return;
    }

    const interaction = await ai.interactions.create({
      agent: managedAgent,
      environment: 'remote',
      input: `You are the Omnidesk managed agent quality reviewer.

Review this music-video production plan for:
1. IP/copyright/likeness risks.
2. Whether the scene prompts are strong enough for Veo 3.1.
3. Whether the plan demonstrates managed-agent product value.
4. Specific changes to improve live-demo reliability.

Return concise JSON only:
{
  "status": "pass|warn|blocked",
  "managedAgentFindings": string[],
  "promptImprovements": [{"sceneId": string, "recommendation": string}],
  "demoReliabilityNotes": string[]
}

Brief:
${brief || ''}

Plan:
${JSON.stringify(plan || {}, null, 2)}`
    }, { timeout: 300_000 });

    const review = {
      ok: true,
      agent: managedAgent,
      interactionId: interaction.id,
      environmentId: interaction.environment_id,
      outputText: extractInteractionText(interaction),
      steps: interaction.steps || []
    };
    if (projectId) {
      await updateProjectRecord(projectId, (record) => ({
        ...record,
        agentReview: review
      }));
    }
    res.json(review);
  } catch (err) {
    next(err);
  }
});

app.get('/api/live/managed-agents', (_req, res) => {
  res.json({
    ok: true,
    agent: managedAgent,
    roles: MANAGED_AGENT_ROLES
  });
});

app.post('/api/live/managed-agent-role', async (req, res, next) => {
  try {
    assertConfigured();
    if (!ai.interactions?.create) {
      res.status(501).json({
        ok: false,
        error: 'This @google/genai build does not expose interactions.create. Update @google/genai or use the REST Interactions API.'
      });
      return;
    }

    const { brief, lyrics, plan, projectId, roleId, priorResults = [] } = req.body;
    const role = MANAGED_AGENT_ROLES.find((item) => item.id === roleId);
    if (!role) {
      res.status(404).json({ ok: false, error: 'Unknown managed-agent role.' });
      return;
    }

    const result = await runManagedRole({ role, brief, lyrics, plan });
    const results = [
      ...priorResults.filter((item) => item.role?.id !== role.id),
      result
    ];
    const review = {
      ok: true,
      agent: managedAgent,
      status: results.length === MANAGED_AGENT_ROLES.length ? 'completed' : 'running',
      count: results.length,
      total: MANAGED_AGENT_ROLES.length,
      aggregate: buildAgentAggregate(results),
      results
    };

    await updateAgentReviewRecord(projectId, review);
    res.json({ ok: true, result, review });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/managed-agent-swarm', async (req, res, next) => {
  try {
    assertConfigured();
    if (!ai.interactions?.create) {
      res.status(501).json({
        ok: false,
        error: 'This @google/genai build does not expose interactions.create. Update @google/genai or use the REST Interactions API.'
      });
      return;
    }

    const { brief, lyrics, plan, selectedAgentIds, projectId } = req.body;
    const selected = Array.isArray(selectedAgentIds) && selectedAgentIds.length
      ? MANAGED_AGENT_ROLES.filter((role) => selectedAgentIds.includes(role.id))
      : MANAGED_AGENT_ROLES;

    const results = [];
    for (const role of selected) {
      results.push(await runManagedRole({ role, brief, lyrics, plan }));
    }

    const aggregate = buildAgentAggregate(results);

    const review = {
      ok: true,
      agent: managedAgent,
      status: 'completed',
      count: results.length,
      total: selected.length,
      aggregate,
      results
    };
    await updateAgentReviewRecord(projectId, review);
    res.json(review);
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const normalized = normalizeError(err);
  res.status(normalized.status).json({
    ok: false,
    error: normalized.message,
    code: normalized.code
  });
});

export default app;
