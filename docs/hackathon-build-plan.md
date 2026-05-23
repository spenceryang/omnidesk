# Omnidesk Hackathon Build Plan

## Goal

Ship a working 3-minute demo of a managed-agent music video production desk.

## Demo Script

1. Open Omnidesk dashboard.
2. Create project: "Neon Drift".
3. Upload a licensed/demo song snippet and a creator-owned dance clip or reference images.
4. Enter brief: "original neon space-western dance video, cinematic, no franchise references."
5. Run agents.
6. Show:
   - music section analysis
   - creator DNA extraction
   - style bible
   - IP-safe rewrite
   - timestamped scene plan
   - storyboard timeline
7. Generate 2-4 key scenes.
8. Remix: "make the chorus vertical and more energetic, keep my movement and outfit."
9. Show child version, changed scenes, updated prompts, and export/provenance report.

## Team Swimlanes

### Frontend

- Project creation page.
- Asset upload UI.
- Brief and constraints form.
- Agent progress dashboard.
- Timeline/storyboard view.
- Remix command bar.
- Export/provenance view.

### Backend / Data

- Cloud Run API.
- Firestore project graph.
- GCS upload flow.
- Job status model.
- Demo seed data and fallback media.
- Export manifest generation.

### AI / Agents

- Gemini 3.5 Flash prompts.
- Managed agent orchestration.
- Safety rewrite prompt.
- Scene planner prompt.
- Prompt generation prompt.
- Remix prompt.
- Omni/Veo/Lyria integration or mocks/fallbacks.

## Day 0 Prep

- Prepare a rights-safe demo song or generated/owned audio.
- Prepare creator-owned dance/reference clips.
- Prepare 3-5 fallback generated keyframes.
- Confirm access to Gemini 3.5 Flash, Managed Agents, Omni/Flow, Veo, Lyria, GCS, Firestore.
- Create Google Cloud project and buckets.

## 8-Hour Build Scope

### Must Have

- Upload or select demo assets.
- Save project to Firestore.
- Run agent pipeline and display structured outputs.
- Generate or display 2-4 scene assets.
- Remix one scene branch.
- Show safety/provenance report.

### Should Have

- Simple video preview timeline.
- Beat/section markers.
- Lock controls for outfit/movement/style.
- Export JSON manifest.

### Nice To Have

- Real video rendering.
- Lyria-generated stinger or alternate chorus.
- Side-by-side version comparison.
- Shareable public project page.

## Implementation Order

1. Build static frontend shell with mock project data.
2. Define Firestore schema and seed one project.
3. Implement Gemini 3.5 Flash agent prompts returning JSON.
4. Wire agent run endpoint to update Firestore.
5. Add GCS upload.
6. Integrate image/video generation where access is available.
7. Add remix branch endpoint.
8. Polish demo flow.

## Judging Alignment

### Impact Potential

Independent creators need production-quality short-form visual content and cannot coordinate a full creative team for every track.

### Live Demo

The demo is visual, fast, and resilient because it can fall back to storyboards if video generation is slow.

### Creativity and Originality

Omnidesk is not a generic prompt-to-video app. It uses creator-owned source material and managed agents to maintain originality, continuity, safety, and remix history.

### Best Use Of Managed Agents

The product requires agent specialization:

- Music analysis
- Creator DNA extraction
- Creative direction
- Scene planning
- Continuity review
- IP safety
- Prompt generation
- Model routing
- Audio improvement
- Editing
- Remix branching

## Demo Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Video generation too slow | Use generated keyframes and storyboard reel fallback |
| Omni unavailable via API | Use Flow manually for demo output or Veo/Imagen fallback |
| Lyria unavailable | Show audio edit plan and use licensed demo audio |
| IP concerns | Use owned assets, generated assets, and explicit safety report |
| Agent API instability | Cache one completed demo run in Firestore |

