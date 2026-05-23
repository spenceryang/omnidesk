# Omnidesk TODOs

These are the current implementation gaps to close before treating Omnidesk as production-ready.

## Managed Agents

- Create separate persistent managed-agent definitions instead of routing all 12 specialist roles through one configured agent.
- Move the first planning pass into a managed-agent workflow, or clearly label it as Gemini 3 Flash planning followed by managed-agent review.
- Persist each managed-agent interaction ID, role output, score, and required change.
- Add a retry and timeout strategy for long multi-agent review runs.

## Video Generation

- The current implementation uses Veo 3.1 through `generateVideos`; it does not use a public Omni video API.
- Add an abstraction for video providers so Omni can be added if/when the target API is available.
- Add UI labeling that clearly says generated clips are Veo clips.
- Add queue controls for generating all 10 scenes without manually clicking each scene.

## Plan Persistence

- Save each script, music analysis, style bible, scene plan, prompt pack, and safety report after creation.
- Add a project/session ID so users can reload work after refreshing the page.
- Store plan versions when users rerun prompts or agent checks.
- Add export for the full production plan as JSON and Markdown.

## Storage

- Replace `/tmp/omnidesk` and local filesystem storage with durable media storage.
- Store uploaded assets and generated MP4s in Google Cloud Storage or Vercel Blob.
- Store job metadata in Firestore, Postgres, or another durable database instead of an in-memory `Map`.
- Add signed URLs or scoped public URLs for generated video playback.
- Add retention and cleanup rules for uploaded assets and generated outputs.

## Reliability

- Add status polling that survives serverless cold starts.
- Add clear failed-job recovery in the UI.
- Add a small smoke test for `/api/health`, `/api/live/managed-agents`, and `/api/live/plan`.
- Add server-side validation for scene count, duration, aspect ratio, and prompt length.

## Product Polish

- Add a project history/sidebar once persistence exists.
- Add “Generate all demo scenes” and “Generate hero scenes only” actions.
- Add an edit step where agent feedback can rewrite scene prompts before video generation.
- Add visible provenance for which model created each plan, agent review, audio plan, and clip.
