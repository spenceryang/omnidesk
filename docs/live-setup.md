# Live Setup

Omnidesk now has a live local backend for testing real Gemini API calls.

## What Is Live

- Gemini 3 Flash planning through `@google/genai`.
- Uploaded audio, video, image, lyric, and reference files are sent to the Gemini Files API for planning context.
- Veo 3.1 video generation jobs can be started per scene.
- Generated videos are downloaded to `server/generated/` and served back to the UI.
- Managed Agents / Interactions API review can run against a completed plan with `antigravity-preview-05-2026`.
- Lyria support currently generates a rights-safe Lyria control plan. The realtime WebSocket music stream is not yet connected.

## What Is Not Yet Live

- Gemini Omni is not exposed as a public Gemini API endpoint in the official docs checked on May 23, 2026. The working video API path is Veo 3.1.
- Managed Agents API is wired as a review pass, not the default planner path. The default planner uses Gemini 3 Flash structured output because it can directly consume uploaded Files API assets.
- Google Cloud Storage and Firestore are not wired yet; local disk is used for fastest testing.

## Run Locally

Create `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
GEMINI_API_KEY=your_ai_studio_key_here
```

Start the backend:

```bash
npm run api
```

Start the frontend in a second terminal:

```bash
npm run dev
```

Open the local Vite URL and use **Live Generate**.

## Cost And Latency

The default live plan is a 60-second music video split into 10 scenes, usually 6 seconds per Veo clip. Veo generation is a long-running API job. Expect each clip to take roughly tens of seconds to several minutes depending on model load and account limits. Generate one scene first before starting multiple scenes.

## Default 10-Scene Structure

For a one-minute music video, Omnidesk asks Gemini to return exactly 10 scenes:

| Scene | Time | Purpose |
| --- | --- | --- |
| 01 | 0:00-0:06 | Hook/opening image |
| 02 | 0:06-0:12 | World setup |
| 03 | 0:12-0:18 | Verse 1 movement or story beat |
| 04 | 0:18-0:24 | Motif reveal |
| 05 | 0:24-0:30 | Chorus 1 hero moment |
| 06 | 0:30-0:36 | Post-chorus variation |
| 07 | 0:36-0:42 | Bridge / contrast scene |
| 08 | 0:42-0:48 | Final chorus escalation |
| 09 | 0:48-0:54 | Climax / strongest visual |
| 10 | 0:54-1:00 | Outro / resolution |
