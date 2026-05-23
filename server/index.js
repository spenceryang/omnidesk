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
const uploadDir = path.join(__dirname, 'uploads');
const generatedDir = path.join(__dirname, 'generated');

await fs.mkdir(uploadDir, { recursive: true });
await fs.mkdir(generatedDir, { recursive: true });

const app = express();
const port = Number(process.env.OMNIDESK_API_PORT || 8787);
const upload = multer({ dest: uploadDir, limits: { fileSize: 80 * 1024 * 1024 } });

const plannerModel = process.env.GEMINI_PLANNER_MODEL || 'gemini-3-flash-preview';
const videoModel = process.env.GEMINI_VIDEO_MODEL || 'veo-3.1-generate-preview';
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const videoJobs = new Map();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/outputs', express.static(generatedDir));

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

  return {
    originalName: file.originalname,
    mimeType,
    uri: uploaded.uri
  };
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
    job.outputUrl = `/outputs/${filename}`;
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
      agent: 'antigravity-preview-05-2026',
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
      agent: 'antigravity-preview-05-2026',
      interactionId: interaction.id,
      environmentId: interaction.environment_id,
      outputText: interaction.output_text,
      steps: interaction.steps || []
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

app.listen(port, '127.0.0.1', () => {
  console.log(`Omnidesk live API running on http://127.0.0.1:${port}`);
});
