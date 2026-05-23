# Omnidesk Safety and IP Policy

## Product Position

Omnidesk helps creators make original music videos from assets they own or have permission to use. The product should not be used to copy protected characters, imitate living artists, impersonate real people, or launder copyrighted media into generated content.

## Allowed Inputs

- User-owned songs, stems, lyrics, dance clips, images, and videos.
- Licensed audio or visual assets.
- Generated assets produced inside Omnidesk.
- Public-domain or Creative Commons assets when license terms are recorded.
- User-provided references used as broad inspiration, not direct copying.

## Disallowed Inputs Or Requests

- Copyrighted songs without rights.
- Requests to imitate a named living artist's voice or exact musical style.
- Requests to copy a specific movie, franchise, character, logo, costume, vehicle, or identifiable protected design.
- Requests to use another real person's face, body, voice, or dance without permission.
- Requests to create misleading deepfakes.
- Requests involving explicit sexual content, hateful content, or illegal activity.

## Risky Prompt Examples

| Risky | Safer rewrite |
| --- | --- |
| "Make it like The Mandalorian" | "Original dusty space-western atmosphere with desert outposts, practical sci-fi props, cinematic sunset lighting" |
| "Use Taylor Swift-style vocals" | "Bright pop vocal texture, intimate storytelling, polished radio mix" |
| "Make me look like Bad Bunny" | "Urban performance styling with bold color blocking and confident stage presence" |
| "Use Batman in the chorus" | "Use an original masked nighttime vigilante silhouette with no recognizable logo or costume details" |

## Safety Agent Requirements

The IP Safety Agent must:

1. Detect named franchises, characters, brands, logos, artists, and celebrities.
2. Rewrite risky references into original descriptive language.
3. Block requests involving unauthorized real-person likeness or voice cloning.
4. Require rights declarations for uploaded audio and visual assets.
5. Attach safety status to every scene and generation prompt.
6. Produce a provenance report for export.

## Disclosure

Generated previews should be labeled as generated or AI-assisted when exported. Real creator-owned footage should be labeled as user-provided.

## Hackathon Demo Rule

The demo should clearly separate:

- what the team built during the hackathon: agent pipeline, UI, storage graph, safety logic, remix workflow
- what Google provides: Gemini 3.5 Flash, Managed Agents, Omni/Flow, Veo, Lyria, Imagen/Nano Banana, Google Cloud

