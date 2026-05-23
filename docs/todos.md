# Omnidesk Remaining TODOs

These are the remaining implementation gaps after adding live planning, managed-agent review, Veo clip generation, clip combining, Vercel Blob media storage, and the Discover tab.

## Managed Agents

- Create separate persistent managed-agent definitions instead of routing all 12 specialist roles through one configured agent.
- Move the first planning pass into a managed-agent workflow, or clearly label it as Gemini 3 Flash planning followed by managed-agent review.
- Persist each managed-agent interaction ID, role output, score, and required change.
- Add a retry and timeout strategy for long multi-agent review runs.

## Video Generation

- The current implementation uses Veo 3.1 through `generateVideos`; it does not use a public Omni video API.
- Add an abstraction for video providers so Omni can be added if/when the target API is available.
- Add richer queue controls for pause, retry failed scene, and regenerate selected scenes.
- Add a server-side render job model so long 10-scene generation can resume after serverless cold starts.

## Plan Persistence

- Store plan versions when users rerun prompts or agent checks.
- Add a project/session reload view for unfinished projects.
- Add export for the full production plan as JSON and Markdown.

## Storage

- Uploaded assets are still submitted through the server. Add direct client uploads for larger creator videos that exceed serverless request limits.
- Generated MP4s and public project records are stored in Vercel Blob in production, with local filesystem fallback for development.
- Store job metadata in Firestore, Postgres, or another durable database instead of an in-memory `Map`.
- Decide whether generated community videos should remain public or use signed/scoped URLs for private projects.
- Add retention and cleanup rules for uploaded assets and generated outputs.

## Reliability

- Add status polling that survives serverless cold starts.
- Add clear failed-job recovery in the UI.
- Add a small smoke test for `/api/health`, `/api/live/managed-agents`, and `/api/live/plan`.
- Add server-side validation for scene count, duration, aspect ratio, and prompt length.

## Product Polish

- Add a private project history/sidebar for the current creator.
- Add “Generate hero scenes only” actions.
- Add an edit step where agent feedback can rewrite scene prompts before video generation.
- Add visible provenance for which model created each plan, agent review, audio plan, and clip.
