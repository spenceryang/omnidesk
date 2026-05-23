# Spec-To-Video Production: "The Desk Wakes Up"

This production turns the Omnidesk product spec into a 45-second music video concept and prompt package.

## Creative Direction

**Title:** The Desk Wakes Up

**Logline:** A creator's scattered assets become a living production desk: audio pulses, uploaded dance footage becomes motion grammar, agents light up like a control room, and the final scene branches into multiple remix worlds.

**Format:** 9:16 vertical, 45 seconds

**Music Direction:** Fast electronic pop with a clean intro, rising verse, bright chorus/drop, and a short glitchy outro. Avoid named artist references. Use crisp percussion, warm analog bass, airy vocal chops, and cinematic risers.

## Intended Model Usage

- Gemini 3.5 Flash: derive the style bible, scene plan, safety checks, prompt pack, and remix branch.
- Gemini Omni / Flow: generate or edit the video clips from the prompts and source assets.
- Lyria: create or improve the music bed, intro sting, and chorus lift.
- Imagen / Nano Banana: generate storyboard keyframes if Omni video access is unavailable.

## Files

- `flash-agent-output.json`: structured output expected from the managed-agent planning pass.
- `shotlist.md`: readable shot list for director/editor review.
- `omni-prompts.json`: per-scene prompts for Omni/Veo-style generation.
- `audio-plan.md`: Lyria-ready music and sound design direction.
- `remix-branch.json`: example remix request and resulting changed scenes.
- `safety-report.md`: IP/originality/provenance assessment.

## Demo Use

1. Use `flash-agent-output.json` as the cached managed-agent result.
2. Generate scenes 03, 04, and 06 first; they carry the strongest visual proof.
3. If video generation is slow, generate still keyframes from `omni-prompts.json` and assemble as a storyboard reel.
4. Trigger the remix branch live: "Make the chorus vertical, brighter, and more kinetic while preserving the desk/control-room motif."

