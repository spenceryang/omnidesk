# Omnidesk Product Spec

## One-Liner

Omnidesk is an agentic music video production studio that turns creator-owned media into original, IP-safe, remixable music videos.

## Target User

Independent musicians, creators, dancers, and small artist teams who need short-form music video assets but do not have a director, editor, motion designer, rights reviewer, and prompt engineer on call.

## User Problem

Creators can generate clips, but they struggle to produce a coherent music video because current tools do not maintain narrative, timing, continuity, originality, remix history, or rights safety across scenes.

## Product Promise

Give Omnidesk a track and creator-owned visual DNA. It returns a production-ready scene plan, style bible, generated scenes, remix controls, and a safety/provenance report.

## User Journey

1. Create project
   - User names the project.
   - User selects target format: TikTok/Reels, YouTube, Spotify Canvas, or full music video.
   - User chooses output length: 15s, 30s, 60s, or custom.

2. Upload creator DNA
   - Track or song snippet.
   - Lyrics, optional.
   - Dance clip, performance footage, outfit photos, location clips, sketches, or moodboard assets the creator owns.
   - Brand and safety constraints.

3. Rights and consent check
   - System asks whether the user owns or has permission for the uploaded audio, face, likeness, choreography, images, and references.
   - Risky references are flagged before generation.

4. Creative brief
   - User describes the intended video in natural language.
   - Example: "original neon space-western dance video in a train station, cinematic, lonely but high energy."
   - The IP Safety Agent rewrites unsafe references into original aesthetic language.

5. Agent production plan
   - Music analysis with sections, mood shifts, and beat markers.
   - Creator DNA summary with movement, palette, wardrobe, setting, motifs.
   - Style bible.
   - Timestamped scene plan.
   - Prompt pack.
   - Continuity rules.
   - Originality and IP safety report.

6. Storyboard review
   - User sees scenes on a timeline.
   - Each scene has a keyframe, description, generation prompt, source asset links, and safety status.
   - User can lock scenes, characters, movement, outfit, location, or color palette.

7. Generate preview
   - User generates selected scenes first.
   - The system prioritizes chorus/drop scenes for demo impact.
   - If video generation is unavailable or slow, it creates keyframes plus motion/edit instructions.

8. Remix mode
   - User gives a natural-language edit.
   - Examples:
     - "Make the chorus brighter."
     - "Use more of my dance timing."
     - "Change the setting to a rain-soaked rooftop."
     - "Make it vertical for TikTok."
   - The Remix Agent branches the project, preserving provenance and the original version.

9. Export
   - Export short preview video, storyboard, prompt pack, timeline JSON, and safety/provenance report.

## Key Features

### Creator DNA Pack

Extracts original signal from user-owned assets:

- movement style
- recurring gestures
- wardrobe and silhouette
- color palette
- location textures
- personal motifs
- lyric themes
- camera energy

### Agentic Production Desk

Managed agents collaborate as a production team:

- Music Analyst Agent
- Creative Director Agent
- Creator DNA Agent
- Scene Planner Agent
- Continuity Agent
- IP Safety Agent
- Prompt Engineer Agent
- Generation Router Agent
- Audio Agent
- Editor Agent
- Remix Agent

### Remix Branching

Every remix is a branch, not a destructive edit. Users can compare versions and see what changed.

### Originality Score

A visible score that rewards:

- user-owned source material
- original motif usage
- avoided protected IP
- prompt specificity
- continuity across scenes
- meaningful transformation from inputs

### Provenance Report

Each generated asset links back to:

- source uploads
- prompts
- model used
- safety checks
- user consent statements
- remix branch

## MVP Screens

1. Project setup and upload
2. Creative brief and constraints
3. Agent run dashboard
4. Timeline/storyboard
5. Remix command bar
6. Export and provenance report

## Non-Goals For Hackathon

- Full professional timeline editor.
- Native payments.
- Full-length video rendering.
- Deepfake-like real-person impersonation.
- Copyrighted artist/style imitation.
- Scraping copyrighted music/video assets.

