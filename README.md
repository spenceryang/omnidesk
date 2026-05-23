# Omnidesk

Omnidesk is a managed-agent music video studio for creators.

It turns a creator-owned song, dance clip, visual references, and natural-language brief into an original, IP-safe, remixable music video plan with generated scenes, audio improvements, and an editable timeline.

## Hackathon Thesis

Most AI video tools generate isolated clips from prompts. Omnidesk behaves like a production desk: Gemini 3.5 Flash coordinates specialist agents that analyze the music, extract creator DNA, plan scenes, preserve continuity, check IP risk, route generation to Omni/Veo/Lyria, and store every decision as a remixable production graph.

## Core Demo

1. Upload a short track, lyrics, and creator-owned dance/reference clips.
2. Enter a brief such as: "original neon space-western performance video, cinematic but no franchise references."
3. Managed agents produce a music analysis, style bible, scene plan, safety report, and prompt pack.
4. Generate 2-4 key scenes or storyboard frames.
5. Ask for a remix: "make the chorus vertical and more energetic, keep my movement and outfit."
6. Show the branched timeline, updated prompts, and export-ready preview.

## Primary Google Products

- Gemini 3.5 Flash: agent reasoning, scene planning, prompt generation, continuity, IP safety, remix planning.
- Managed Agents in the Gemini API: orchestration for specialist production agents.
- Gemini Omni / Flow: multimodal video generation and conversational scene editing where available.
- Veo: fallback or complementary short-clip generation.
- Lyria: music extensions, alternate sections, stingers, or safe audio-bed generation.
- Imagen / Nano Banana: storyboard frames, thumbnails, reference stills.
- Google Cloud Storage: raw assets, generated media, previews, exports.
- Firestore: project graph, scenes, prompts, remixes, safety decisions, provenance.
- Cloud Run: backend API, generation workers, webhook handlers.

## Repository Contents

- [Product Spec](docs/product-spec.md)
- [Technical Spec](docs/technical-spec.md)
- [Hackathon Build Plan](docs/hackathon-build-plan.md)
- [Safety and IP Policy](docs/safety-ip-policy.md)
- [Live Setup](docs/live-setup.md)

## Live Testing

Omnidesk includes a local backend for live Gemini API testing. Add your AI Studio key to `.env`, run `npm run api`, then run `npm run dev` and open the **Live Generate** workspace.

The live path uses Gemini 3 Flash for planning and Veo 3.1 for generated clips. Uploaded creator assets are sent to Gemini Files API for planning context.

## MVP Boundary

The MVP is not a full professional NLE. The goal is a reliable agentic workflow that can produce a convincing short music-video preview and demonstrate remixability, provenance, and rights-aware generation.
