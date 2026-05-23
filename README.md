# Omnidesk

Omnidesk is a live music-video generation studio for creators.

It takes a creative prompt plus optional creator-owned assets, produces a 10-scene plan for a 60-second music video, runs managed-agent quality checks, creates an audio-control plan, generates video clips through the Gemini API stack, combines ready clips into a final MP4, and publishes completed work to Discover.

Live app: [https://omnidesk-seven.vercel.app](https://omnidesk-seven.vercel.app)

## What It Does

- Creates a rights-safe music-video concept from a prompt and uploaded assets.
- Breaks the video into 10 timed scenes for a one-minute edit.
- Uses Gemini planning to produce scene descriptions, Veo prompts, safety notes, and music sections.
- Runs a 12-role managed-agent review across music, continuity, IP safety, prompt quality, edit flow, remixability, and demo reliability.
- Creates a Lyria-style audio control plan for section-level music direction.
- Generates individual scene clips with Veo when the API is configured.
- Combines generated clips into a one-minute video with ffmpeg.
- Stores public project records and generated MP4s in Vercel Blob on production.
- Shows stored community generations in the Discover tab.

## Current Product Surface

The app is intentionally focused on one live workflow:

1. Enter creative direction.
2. Choose format, duration, and scene count.
3. Upload optional audio, video, image, lyric, or reference assets.
4. Create a 10-scene production plan.
5. Run the managed-agent check.
6. Generate selected scene clips, or generate all scenes and combine them.
7. View completed public generations in Discover.

Old mock storyboard screens and local demo data have been removed.

## Google Products Used

- Gemini 3 Flash preview for planning, scene writing, prompt generation, and audio-control JSON.
- Gemini Files API for uploaded asset context.
- Gemini Managed Agents / Interactions API for specialist agent review.
- Veo 3.1 preview for generated video clips.
- Lyria-oriented planning for music direction.

Note: the current public Gemini API path in this repo uses Veo for video generation. If a public “Gemini Omni” video API becomes available in the target environment, it can be added behind the same scene-generation interface.

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Add your AI Studio key to `.env`:

```bash
GEMINI_API_KEY=your_key_here
```

Run the API server:

```bash
npm run api
```

Run the web app:

```bash
npm run dev
```

Open the local URL printed by Vite.

## Environment Variables

```bash
GEMINI_API_KEY=your_ai_studio_key_here
GEMINI_PLANNER_MODEL=gemini-3-flash-preview
GEMINI_VIDEO_MODEL=veo-3.1-generate-preview
GEMINI_MANAGED_AGENT=antigravity-preview-05-2026
OMNIDESK_API_PORT=8787
BLOB_READ_WRITE_TOKEN=vercel_blob_token_for_durable_public_media
```

Only `GEMINI_API_KEY` is required for planning and generation. `BLOB_READ_WRITE_TOKEN` is required for durable production storage and Discover persistence on Vercel. The model variables are optional overrides.

## Vercel Deployment

The frontend is deployed on Vercel. The API is wired through `api/[...path].js` and `server/app.js`.

For live generation on Vercel, set `GEMINI_API_KEY` in the Vercel project environment and redeploy production. Without that environment variable, the deployed UI will load but show `API offline`, and generation buttons will stay disabled.

For community Discover persistence, link a Vercel Blob store to the project so `BLOB_READ_WRITE_TOKEN` is available in production. Without Blob, local development falls back to filesystem storage.

## Useful Commands

```bash
npm run dev
npm run api
npm run build
npm run lint
```

## Repository Map

- `src/App.jsx` - app shell and top-level product surface.
- `src/components/LiveGeneration.jsx` - prompt, upload, planning, managed-agent review, and clip generation workflow.
- `src/services/liveApi.js` - client-side API helpers.
- `server/app.js` - Express API used locally and by Vercel serverless.
- `server/index.js` - local API server entry point.
- `api/[...path].js` - Vercel serverless entry point.
- `api/discover.js` - Vercel shortcut entry point for public generated projects.
- `docs/` - product, technical, build, safety, and live setup notes.
- `docs/todos.md` - current implementation gaps and next steps.

## License

MIT License. See [LICENSE](LICENSE).
