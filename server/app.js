import 'dotenv/config';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import multer from 'multer';
import mime from 'mime-types';
import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent
} from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const runtimeDir = process.env.VERCEL ? '/tmp/omnidesk' : __dirname;
const uploadDir = path.join(runtimeDir, 'uploads');
const generatedDir = path.join(runtimeDir, 'generated');

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(generatedDir, { recursive: true });

const app = express();
const upload = multer({ dest: uploadDir, limits: { fileSize: 80 * 1024 * 1024 } });

const plannerModel = process.env.GEMINI_PLANNER_MODEL || 'gemini-3-flash-preview';
const videoModel = process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-generate-preview';
const managedAgent = process.env.GEMINI_MANAGED_AGENT || 'antigravity-preview-05-2026';
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const videoJobs = new Map();
const GEMINI_FILE_ACTIVE_TIMEOUT_MS = Number(process.env.GEMINI_FILE_ACTIVE_TIMEOUT_MS || 45_000);
const GEMINI_FILE_POLL_INTERVAL_MS = Number(process.env.GEMINI_FILE_POLL_INTERVAL_MS || 2_000);

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

async function runManagedRole({ role, brief, plan }) {
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

function productionPrompt({ brief, targetFormat, durationSeconds, sceneCount, constraints }, uploadedFiles) {
  const targetDuration = Number(durationSeconds || 60);
  const targetSceneCount = Number(sceneCount || 10);
  const sceneDuration = Math.max(4, Math.round(targetDuration / targetSceneCount));
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
Target generated clip duration per scene: ${sceneDuration} seconds
Creator constraints:
${constraints || 'Original, rights-safe, no named franchise or artist imitation.'}

Uploaded assets:
${assetSummary || 'No assets uploaded.'}

Return this JSON shape:
{
  "title": "short project title",
  "format": "9:16 or 16:9 or 1:1",
  "durationSeconds": number,
  "musicAnalysis": {
    "bpmEstimate": number | null,
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
      "durationSeconds": 6
    }
  ]
}

Rules:
- Avoid named artists, celebrity likenesses, copyrighted characters, protected logos, and franchise lookalikes.
- If the user asks for risky IP, rewrite it into original descriptive language.
- Return exactly ${targetSceneCount} scenes for a ${targetDuration}-second music video.
- Each scene should be roughly ${sceneDuration} seconds and should be directly generatable as a standalone Veo clip.
- Use scene IDs scene_01 through scene_${String(targetSceneCount).padStart(2, '0')}.
- Cover the whole music-video arc: hook/open, world setup, verse 1, motif reveal, chorus 1, post-chorus, bridge, final chorus, climax, outro/resolution.
- If uploaded dance video is present, preserve movement timing conceptually without impersonating identity unless consent is clear.
- Make scenes 1, 5, and 9 the highest demo-impact moments.`;
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    configured: Boolean(ai),
    plannerModel,
    videoModel,
    managedAgent,
    managedAgentCount: MANAGED_AGENT_ROLES.length,
    storage: 'local filesystem',
    note: ai
      ? 'Gemini API key is configured.'
      : 'Set GEMINI_API_KEY in .env to enable live generation.'
  });
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

    res.json({
      ok: true,
      model: plannerModel,
      uploadedAssets: uploadedFiles,
      plan
    });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/videos', async (req, res, next) => {
  try {
    assertConfigured();
    const {
      sceneId,
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

    const operation = await ai.models.generateVideos({
      model: videoModel,
      prompt,
      config: {
        aspectRatio,
        durationSeconds: String(durationSeconds),
        resolution,
        negativePrompt: negativePrompt || undefined
      }
    });

    const jobId = crypto.randomUUID();
    videoJobs.set(jobId, {
      id: jobId,
      sceneId: sceneId || 'scene',
      operation,
      prompt,
      model: videoModel,
      status: 'running',
      createdAt: new Date().toISOString(),
      outputPath: null,
      outputUrl: null
    });

    res.json({
      ok: true,
      jobId,
      sceneId,
      model: videoModel,
      operationName: operation.name || null,
      status: 'running'
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/live/videos/:jobId', async (req, res, next) => {
  try {
    assertConfigured();
    const job = videoJobs.get(req.params.jobId);
    if (!job) {
      res.status(404).json({ ok: false, error: 'Unknown video job.' });
      return;
    }

    if (job.status === 'completed') {
      res.json({ ok: true, ...job });
      return;
    }

    job.operation = await ai.operations.getVideosOperation({ operation: job.operation });

    if (!job.operation.done) {
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

    job.status = 'completed';
    job.outputPath = downloadPath;
    job.outputUrl = `/api/outputs/${filename}`;
    job.completedAt = new Date().toISOString();
    videoJobs.set(job.id, job);

    res.json({ ok: true, ...job });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/lyria-plan', async (req, res, next) => {
  try {
    assertConfigured();
    const { brief, plan } = req.body;
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
    res.json({ ok: true, model: plannerModel, plan: JSON.parse(cleanJson(response.text || '{}')) });
  } catch (err) {
    next(err);
  }
});

app.post('/api/live/managed-agent-review', async (req, res, next) => {
  try {
    assertConfigured();
    const { brief, plan } = req.body;
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

    res.json({
      ok: true,
      agent: managedAgent,
      interactionId: interaction.id,
      environmentId: interaction.environment_id,
      outputText: extractInteractionText(interaction),
      steps: interaction.steps || []
    });
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

    const { brief, plan, selectedAgentIds } = req.body;
    const selected = Array.isArray(selectedAgentIds) && selectedAgentIds.length
      ? MANAGED_AGENT_ROLES.filter((role) => selectedAgentIds.includes(role.id))
      : MANAGED_AGENT_ROLES;

    const results = [];
    for (const role of selected) {
      results.push(await runManagedRole({ role, brief, plan }));
    }

    const aggregate = {
      pass: results.filter((item) => item.result.status === 'pass').length,
      warn: results.filter((item) => item.result.status === 'warn').length,
      blocked: results.filter((item) => item.result.status === 'blocked').length,
      averageScore: Math.round(results.reduce((sum, item) => sum + Number(item.result.score || 0), 0) / Math.max(results.length, 1))
    };

    res.json({
      ok: true,
      agent: managedAgent,
      count: results.length,
      aggregate,
      results
    });
  } catch (err) {
    next(err);
  }
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({
    ok: false,
    error: err.message || 'Unexpected server error.'
  });
});

export default app;
