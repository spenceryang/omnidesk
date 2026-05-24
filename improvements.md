# Omnidesk Improvements Log

This file captures future improvement ideas and notable issues encountered during the hackathon build.

## Future Product Improvements

- Add a project detail page in Discover so each generated music video can show its final render, individual clips, Lyria track, scene plan, agent review, and applied agent edits in one place.
- Add a remix flow where users can branch an existing generation, change style/tempo/lyrics/assets, and keep attribution to the original project.
- Add manual scene replacement so a creator can regenerate only one weak Veo clip without rerunning the full project.
- Add a clearer timeline editor for arranging clips, trimming scene boundaries, and previewing the continuous Lyria track before final combine.
- Add version history for plans so users can compare the original Gemini plan, managed-agent recommendations, and the applied improvement plan.
- Add stronger creator-asset controls, including selecting which uploaded asset influences each scene.
- Add richer public profile pages for creators and a better Discover ranking model using loves, comments, and recency.
- Add moderation controls for Discover so generated videos can be hidden or removed if they are unsafe or off-brand.

## Future Agent Improvements

- Make managed-agent output more structured by requiring each agent to return explicit JSON patches for the parts of the plan it owns.
- Let users apply recommendations agent-by-agent instead of applying all improvements at once.
- Add a visible diff view that shows exactly what changed in scene descriptions, Veo prompts, negative prompts, safety notes, and music direction.
- Add an agent retry button for a single failed or low-quality agent result.
- Preserve the managed-agent review after applying improvements, while marking it as superseded, so the audit trail is clearer.
- Add a final QA agent after video generation that reviews the finished MP4 for continuity, audio flow, visual issues, and demo readiness.

## Future Generation Improvements

- Improve music continuity by giving Lyria a stronger prompt built from lyrics, plan sections, BPM, mood, and agent feedback.
- Add support for longer videos once Veo rate limits and clip-duration constraints allow it.
- Add better fallback handling when Veo quota is exhausted, including queueing, delayed retry, or placeholder storyboard export.
- Add optional image generation for scene keyframes if video generation fails or takes too long.
- Add automatic subtitle/caption generation from lyrics or user-provided lines.
- Add aspect-ratio-specific prompt tuning for 9:16, 16:9, and 1:1 outputs.
- Add more robust ffmpeg handling for clips with mismatched codecs, frame rates, resolutions, or audio streams.

## Future Technical Improvements

- Add authenticated user accounts so projects can be owned, edited, deleted, and made private.
- Add a durable job queue for Veo polling and final compilation instead of relying on client-side polling.
- Add database-backed project records instead of only JSON records in Vercel Blob.
- Add server-side observability for every generation step: plan, agent run, Lyria track, Veo job, compile, storage, and Discover publish.
- Add integration tests for all production API routes, especially Vercel nested routes.
- Add schema validation for all Gemini JSON outputs before they are saved or rendered.
- Add a cleanup job for temporary files, abandoned jobs, and orphaned Blob objects.
- Add separate staging and production Vercel projects to avoid breaking the live demo while iterating.

## Issues Encountered

- Vercel nested API routing returned platform-level 404s for some paths even though the Express server had matching routes.
- The video polling route originally used `/api/live/videos/:jobId`, which caused Vercel `NOT_FOUND`; it was replaced with `/api/live/video-job?jobId=...`.
- Some production routes existed in Express but not as Vercel entry points, causing endpoints such as managed-agent role progress and Lyria track generation to return 404.
- Adding one Vercel file per endpoint exceeded the Hobby plan serverless function limit, so the app moved to a smaller set of catch-all and explicit route files.
- Managed Agents initially failed with `Missing required field 'environment'`; the Interactions request now sends `environment: { type: "remote" }`.
- Managed-agent errors surfaced as `[object Object]` in the UI because object-shaped API errors were not normalized; client and server error handling now stringify or extract useful messages.
- The managed-agent desk originally auto-started after plan creation, which made the UI feel stuck and spent quota unexpectedly; it is now manually triggered.
- The managed-agent desk originally blocked Lyria, video generation, and final combine; it is now advisory and optional.
- The agent swarm started with 12 roles, which was slow and quota-heavy; it was reduced to 4 roles: IP Safety, Video Prompt Engineer, Creative Director, and Music Analyst.
- Veo duration constraints required clips between 4 and 8 seconds, so the product default moved to a 16-second video with two 8-second scenes.
- Veo quota and RPM limits made generate-all workflows fragile, so the app generates clips sequentially and spaces out starts.
- Uploaded Gemini Files sometimes were not immediately ACTIVE, requiring polling before use.
- Compile could previously create a final MP4 without a valid project record, leaving the render absent from Discover; compile now requires a valid project ID and updates the project record with `finalVideo`.
- Discover initially risked showing non-watchable records; it now filters to projects with final videos or playable clips.
- Lyria audio needed to be generated separately from scene clips to avoid two disconnected music beds across a two-scene video.

## Demo Readiness Notes

- Keep the default demo to 16 seconds and 2 scenes to match Veo duration limits and quota constraints.
- Run the managed-agent desk only when showing the managed-agent track; it is optional for ordinary generation.
- For a stable demo, use a simple original prompt, paste short lyrics, generate the scene plan, optionally run agents, generate the Lyria track, then generate clips and combine.
- If Veo quota is exhausted, show the planning, managed-agent review, Lyria lane, and Discover feed as the fallback demo path.
