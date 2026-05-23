# Omnidesk

Omnidesk is a live music-video generation studio for creators.

It takes a creative prompt, pasted lyrics, and optional creator-owned assets; produces a 16-second, two-scene music-video plan; runs a Gemini Managed Agent production desk; generates Veo clips; creates a continuous Lyria soundtrack; combines everything into a final MP4; and publishes watchable work to Discover.

Live app: [https://omnidesk-seven.vercel.app](https://omnidesk-seven.vercel.app)

## What It Does

- Creates a rights-safe music-video concept from a prompt, lyrics, and uploaded assets.
- Defaults to two 8-second scenes for a 16-second music video.
- Uses Gemini planning to produce scene descriptions, Veo prompts, safety notes, and music structure.
- Runs a 4-role Gemini Managed Agent production desk across IP safety, Veo prompt quality, creative direction, and music continuity.
- Lets users optionally apply managed-agent recommendations back into the plan, or ignore them and continue unchanged.
- Locks generation until the managed-agent desk completes with no blockers.
- Generates individual scene clips with Veo when the API is configured.
- Generates one continuous Lyria 3 music track and muxes it over the final video.
- Combines generated clips into a final MP4 with ffmpeg.
- Stores public project records and generated MP4s in Vercel Blob on production.
- Shows watchable community generations in the Discover tab, with love and comment interactions.

## Current Product Surface

The app is intentionally focused on one live workflow:

1. Enter creative direction and optional lyrics.
2. Choose format, duration, and scene count.
3. Upload optional audio, video, image, or reference assets.
4. Create a music-video plan.
5. Let the Gemini Managed Agent production desk review the brief, lyrics, assets, IP safety, music continuity, Veo prompts, and edit readiness.
6. Generate selected scene clips, generate a Lyria soundtrack, or generate all and combine.
7. View watchable public generations in Discover.

Old mock storyboard screens and local demo data have been removed.

## Google Products Used

- Gemini 3 Flash preview for planning, scene writing, prompt generation, and audio-control JSON.
- Gemini Files API for uploaded asset context.
- Gemini Managed Agents / Interactions API for the specialist production desk.
- Veo 3 Fast Generate for generated video clips by default.
- Lyria 3 Clip preview for a continuous generated soundtrack.

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
GEMINI_VIDEO_MODEL=veo-3.0-fast-generate-001
GEMINI_LYRIA_MODEL=lyria-3-clip-preview
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
