// Mock Data for Omnidesk Agentic Studio

export const INITIAL_PROJECTS = [
  {
    id: 'proj-space-western',
    name: 'Stardust Express',
    format: 'YouTube',
    length: '30s',
    creatorDNA: {
      audioName: 'neon_western_v3_rough.mp3',
      audioSize: '2.4 MB',
      lyrics: 'Riding down the electric line, dust and sparks in the neon light. Underneath a plastic sky, watch the stars prepare to die...',
      danceClip: 'dance_rehearsal_mocap.mp4',
      danceClipSize: '14.2 MB',
      outfits: ['cyber_cowboy_duster.png', 'glow_spurs.png', 'mirrored_visor.png'],
      motifs: ['copper tumbleweed', 'solar railway tracks', 'flickering hologram tickets'],
      brandConstraints: 'Keep lighting transitions organic, avoid pure high-frequency flashing. Moody and cinematic.',
      rightsChecked: {
        audio: true,
        likeness: true,
        choreography: true,
        elements: true
      }
    },
    brief: 'original neon space-western dance video in a train station, cinematic, lonely but high energy.',
    currentBranchId: 'branch-main',
    branches: {
      'branch-main': {
        id: 'branch-main',
        parentId: null,
        name: 'Main Production',
        timestamp: 'May 23, 2026, 11:30 AM',
        originalityScore: 89,
        originalityBreakdown: {
          userSource: 30, // max 30
          originalMotifs: 20, // max 20
          avoidedIP: 20, // max 20
          promptSpecificity: 15, // max 15
          continuity: 14 // max 15
        },
        productionPlan: {
          musicAnalysis: {
            sections: [
              { name: 'Intro', range: '0:00 - 0:05', mood: 'Mysterious Acoustic', beat: 'Low tempo, acoustic slide guitar' },
              { name: 'Build Up', range: '0:05 - 0:12', mood: 'Electronic Synth swells', beat: 'Accelerating beat, sub bass rise' },
              { name: 'Chorus (Drop)', range: '0:12 - 0:25', mood: 'High-energy Neon Beats', beat: '128 BPM heavy syncopated kick' },
              { name: 'Outro', range: '0:25 - 0:30', mood: 'Fading Cyber Acoustic', beat: 'Decelerating, simple reverb guitar' }
            ],
            beatMarkers: [1.2, 2.5, 3.8, 5.0, 6.2, 7.5, 8.8, 10.1, 11.4, 12.0, 12.8, 13.6, 14.4, 15.2, 16.0, 16.8, 17.6, 18.4, 19.2, 20.0, 20.8, 21.6, 22.4, 23.2, 24.0, 24.8, 26.0, 27.5, 29.0]
          },
          creatorDNASummary: {
            movement: 'Sharp popping & locking, arm-sweeping gestures, low spinning drops',
            palette: ['#0B0F19', '#7C3AED', '#06B6D4', '#F43F5E'],
            wardrobe: 'Floor-length heavy canvas duster with embedded violet LEDs, metallic cyber spurs, mirrored dark visor',
            setting: 'Decaying futuristic railway station, rusted metallic surfaces, giant vertical neon billboards',
            motifs: 'Floating copper-wire tumbleweeds, flickering solar tracks, hologram arrival boarding screens'
          },
          styleBible: {
            mood: 'Gritty space-western blended with highly saturated cybernetic lighting. Volumetric fog.',
            colorPalette: ['#120B24', '#7C3AED', '#0891B2', '#E11D48', '#0F172A'],
            visualDirectives: [
              'Maintain high contrast silhouettes against bright background billboards.',
              'Ensure physical reflections of violet and cyan neon on wet floor panels.',
              'Anamorphic lens flares during high-beat drops.'
            ]
          },
          continuityRules: [
            'Duster jacket lights remain active throughout and flicker slightly during beat transitions.',
            'Mirrored visor must display real-time reflections of background station screens.',
            'Spurs ignite with cyan glow only during dynamic spin movements.'
          ],
          ipSafetyReport: {
            status: 'safe',
            flags: [],
            rewriteExplanation: 'No protected intellectual property detected. References to western themes are generalized and original. User assets verified.'
          }
        },
        scenes: [
          {
            id: 'scene-1',
            timestamp: '0:00 - 0:05',
            description: 'Intro: A lone silhouette wearing a digital dust-coat stands on a foggy concrete platform. Holographic schedules flicker overhead.',
            prompt: 'Wide shot, cinematic sci-fi train station, concrete platform shrouded in violet fog, glowing orange holographic train schedule screen, lone cowboy silhouette wearing high-collar coat, volumetric lighting, photorealistic, 8k, Unreal Engine 5 render style.',
            sourceAssetLinks: ['audio_rough.mp3', 'location_sketch.png'],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            // Predefined canvas preview representation
            colorStart: '#1e1b4b',
            colorEnd: '#0f172a',
            graphics: 'platform'
          },
          {
            id: 'scene-2',
            timestamp: '0:05 - 0:12',
            description: 'Build-up: Close-up of the character\'s hands activating glowing cyber-spurs. Heavy rhythmic acoustic guitar begins.',
            prompt: 'Macro close-up, cybernetic cowboy boots, metal spurs glowing with cyan LED light, dust particles floating in light shafts, cinematic composition, shallow depth of field, high contrast, industrial texture.',
            sourceAssetLinks: ['outfit_boot_photo.png', 'glow_spurs.png'],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#0891b2',
            colorEnd: '#0f172a',
            graphics: 'spurs'
          },
          {
            id: 'scene-3',
            timestamp: '0:12 - 0:25',
            description: 'Chorus/Drop: The character explodes into dynamic popping and locking choreography on the platform. A massive hover-train speeds past behind them.',
            prompt: 'Full shot, dynamic action pose, dancer in silver glowing leather duster executing sharp popping choreo, train station platform, sleek holographic bullet train rushing past in background, neon pink and cyber-cyan light streaks, reflection on wet floor, motion blur on train.',
            sourceAssetLinks: ['dance_rehearsal_mocap.mp4', 'cyber_cowboy_duster.png'],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#7c3aed',
            colorEnd: '#e11d48',
            graphics: 'dance'
          },
          {
            id: 'scene-4',
            timestamp: '0:25 - 0:30',
            description: 'Outro: The train disappears into the distance. The character walks down the tracks towards a glowing neon sun.',
            prompt: 'Rear view, medium shot, character walking along glowing train tracks towards a large semi-circular neon orange sun on the horizon, dark silhouettes of futuristic buildings, embers floating, melancholy cinematic vibe.',
            sourceAssetLinks: ['audio_rough.mp3'],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#b45309',
            colorEnd: '#1e293b',
            graphics: 'walk'
          }
        ]
      }
    }
  },
  {
    id: 'proj-cyberpunk-dance',
    name: 'Glitch Rehearsal',
    format: 'TikTok/Reels',
    length: '15s',
    creatorDNA: {
      audioName: 'glitch_hop_140bpm.mp3',
      audioSize: '1.2 MB',
      lyrics: 'Break the signal, feel the feedback... static on the radio...',
      danceClip: 'neon_studio_routine.mp4',
      danceClipSize: '8.4 MB',
      outfits: ['glitch_hoodie.png', 'visor_mask.png'],
      motifs: ['binary dust', 'static noise overlay', 'neon wireframes'],
      brandConstraints: 'Fast energetic cuts, heavy glitches, high speed.',
      rightsChecked: {
        audio: true,
        likeness: true,
        choreography: true,
        elements: true
      }
    },
    brief: 'glitchy cyberpunk street dancing with glowing wireframes and heavy static noise, high energy.',
    currentBranchId: 'branch-main',
    branches: {
      'branch-main': {
        id: 'branch-main',
        parentId: null,
        name: 'Main Production',
        timestamp: 'May 23, 2026, 11:38 AM',
        originalityScore: 92,
        originalityBreakdown: {
          userSource: 30,
          originalMotifs: 19,
          avoidedIP: 20,
          promptSpecificity: 13,
          continuity: 10
        },
        productionPlan: {
          musicAnalysis: {
            sections: [
              { name: 'Glitch Intro', range: '0:00 - 0:03', mood: 'Staticky, fast clicks', beat: '140 BPM hyper cuts' },
              { name: 'Drop Verse', range: '0:03 - 0:12', mood: 'Intense Bass Glitch Hop', beat: 'Heavy double kicks' },
              { name: 'Outro Hook', range: '0:12 - 0:15', mood: 'Signal drop out', beat: 'Slowing tape stop effect' }
            ],
            beatMarkers: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.4, 3.8, 4.2, 4.6, 5.0, 5.4, 5.8, 6.2, 6.6, 7.0, 7.4, 7.8, 8.2, 8.6, 9.0, 9.4, 9.8, 10.2, 10.6, 11.0, 11.4, 11.8, 12.2, 12.6, 13.0, 13.5, 14.0, 14.5]
          },
          creatorDNASummary: {
            movement: 'Voguing, heavy hand tutting, glitched head movements',
            palette: ['#09090B', '#10B981', '#3B82F6', '#8B5CF6'],
            wardrobe: 'Black oversized technical hoodie with reflective piping, white full-coverage visor mask',
            setting: 'Minimalist white concrete room with glowing green gridlines',
            motifs: 'CRT scanlines, digital compression blocks, wireframe spheres'
          },
          styleBible: {
            mood: 'Raw, hyper-digitized, high contrast glitch art.',
            colorPalette: ['#000000', '#10B981', '#06B6D4', '#7C3AED'],
            visualDirectives: [
              'Apply RGB chromatic aberration filters on high beats.',
              'Green neon grid lines must bend when dancer hits a foot stomp.',
              'Keep depth of field flat to mimic surveillance camera footage.'
            ]
          },
          continuityRules: [
            'Visor mask screen displays scrolling green matrix code sync\'d with music beat.',
            'Reflective piping on hoodie stays pure white under flash layers.'
          ],
          ipSafetyReport: {
            status: 'safe',
            flags: [],
            rewriteExplanation: 'General cyberpunk tropes applied. Verified user-owned custom clothing models.'
          }
        },
        scenes: [
          {
            id: 'scene-1',
            timestamp: '0:00 - 0:03',
            description: 'Intro: Dancer stands center in static-filled white room, head tilted, visor flickering.',
            prompt: 'Wide shot, security camera angle, dancer in black technical hoodie standing in minimalist room, glowing emerald green laser gridlines, heavy analog static glitch overlay, RGB splitting, photorealistic detail.',
            sourceAssetLinks: ['glitch_hop_140bpm.mp3', 'visor_mask.png'],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#064e3b',
            colorEnd: '#022c22',
            graphics: 'grid'
          },
          {
            id: 'scene-2',
            timestamp: '0:03 - 0:12',
            description: 'Chorus: Fast tutting routine. Neon wireframes expand from hands on every beat.',
            prompt: 'Medium close-up, dynamic low angle, dancer performing high-speed hand tutting, digital green lines erupting from hands forming complex wireframe geometric patterns, high-contrast black backdrop, volumetric green light.',
            sourceAssetLinks: ['neon_studio_routine.mp4', 'glitch_hoodie.png'],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#10b981',
            colorEnd: '#0f172a',
            graphics: 'hands'
          },
          {
            id: 'scene-3',
            timestamp: '0:12 - 0:15',
            description: 'Outro: Signal breaks into pure noise, dancer freezes in static outline.',
            prompt: 'Full shot, abstract digital disintegration, dancer silhouette turning into glowing white particles, green background grid dissolving, heavy screen distortion, chromatic aberrations.',
            sourceAssetLinks: ['glitch_hop_140bpm.mp3'],
            safetyStatus: 'safe',
            locked: { character: false, movement: false, outfit: false, location: false, palette: false },
            status: 'completed',
            colorStart: '#3b82f6',
            colorEnd: '#1e1b4b',
            graphics: 'static'
          }
        ]
      }
    }
  }
];

export const MOCK_AGENT_LOGS = {
  initialRun: [
    { time: '00:01', agent: 'Audio Analyst', msg: 'Analyzing uploaded track neon_western_v3_rough.mp3... Found 128 BPM tempo.' },
    { time: '00:03', agent: 'Audio Analyst', msg: 'Detected structure: Intro (0s-5s), Build (5s-12s), Heavy Chorus Drop (12s-25s), Outro (25s-30s).' },
    { time: '00:06', agent: 'Creator DNA', msg: 'Scanning uploaded video choreography_rehearsal_clip.mp4...' },
    { time: '00:09', agent: 'Creator DNA', msg: 'Extracted movement style: Sharp popping & locking, hand gestures, spinning drops.' },
    { time: '00:12', agent: 'Creator DNA', msg: 'Analyzing clothing assets: Cyber-duster coat (violet LEDs detected), glowing boots (cyan spurs).' },
    { time: '00:15', agent: 'IP Safety', msg: 'Checking user brief for protected intellectual property and trademarks...' },
    { time: '00:18', agent: 'IP Safety', msg: 'All assets verified as owner-uploaded. No references to external IP in description. Project score starts at +70% (pure DNA).' },
    { time: '00:22', agent: 'Creative Director', msg: 'Establishing mood: Retro space-western. Palette: deep navy, glowing violet, electric cyan, sunset orange.' },
    { time: '00:25', agent: 'Scene Planner', msg: 'Synthesizing scene plan... 4 scenes created corresponding to structural beats.' },
    { time: '00:29', agent: 'Continuity', msg: 'Analyzing props: Spurs mapped to scene 2 and scene 3. Outlining continuity check: jacket must stay on.' },
    { time: '00:32', agent: 'Prompt Engineer', msg: 'Generating prompt packages for diffusion router...' },
    { time: '00:35', agent: 'Prompt Engineer', msg: 'Completed prompts. Forwarding scene specifications to storyboard editor.' },
    { time: '00:38', agent: 'Generation Router', msg: 'Scene rendering simulated successfully. Preview keyframes compiled.' }
  ],
  remixRun: [
    { time: '00:01', agent: 'Remix Agent', msg: 'Initiating remix branch. Parsing edit request: "Change setting to a rain-soaked rooftop while keeping dancer and outfit details."' },
    { time: '00:03', agent: 'Remix Agent', msg: 'Created branch workspace: "Rooftop Rain". Cloning current project tree...' },
    { time: '00:05', agent: 'Continuity', msg: 'Analyzing locked scene parameters. Detected locked items: Character, Outfit, Movement.' },
    { time: '00:07', agent: 'IP Safety', msg: 'Checking remix query for copyrighted references. None detected. Clear.' },
    { time: '00:09', agent: 'Creative Director', msg: 'Adjusting style bible setting from "Futuristic Railway Station" to "Skyline Rooftop under Heavy Rain".' },
    { time: '00:11', agent: 'Scene Planner', msg: 'Rewriting environmental factors across scenes 1, 3, and 4. Scene 2 (boots close-up) remains unchanged.' },
    { time: '00:14', agent: 'Prompt Engineer', msg: 'Adjusting rendering prompts. Injecting: "rain-soaked rooftop platform", "wet concrete reflections", "stormy city skyline bokeh background".' },
    { time: '00:17', agent: 'Continuity', msg: 'Enforcing jacket continuity. Checking reflections on water puddles match glowing duster LEDs.' },
    { time: '00:20', agent: 'Generation Router', msg: 'Re-rendering modified scenes on branch workspace...' },
    { time: '00:23', agent: 'Remix Agent', msg: 'Branch compiled. Originality score updated to 82 (slight deduction for environment modification from original DNA upload).' }
  ],
  ipSafetyFlagged: [
    { time: '00:01', agent: 'IP Safety', msg: 'WARNING: Description contains "looks like a Disney animation with Fortnite character skins".' },
    { time: '00:03', agent: 'IP Safety', msg: 'Flagging copyrighted brand references: "Disney" (Protected Trademark), "Fortnite" (Protected Character designs).' },
    { time: '00:05', agent: 'IP Safety', msg: 'Action: Rewriting brief to maintain creator\'s aesthetic intent while eliminating IP liability...' },
    { time: '00:08', agent: 'IP Safety', msg: 'Rewritten Brief: "Whimsical, high-contrast cell-shaded 3D animation style, futuristic tactical gear with colorful glowing stripes, vibrant cyber-fantasy atmosphere."' },
    { time: '00:10', agent: 'IP Safety', msg: 'Security clearance: PASSED. original prompt safe to generate. Originality score adjusted (penalty avoided).' }
  ]
};

export const MOCK_IP_SAFETY_TESTS = {
  original: "Make it look like a Disney animation with Fortnite character skins.",
  rewritten: "Whimsical, high-contrast cell-shaded 3D animation style, futuristic tactical gear with colorful glowing stripes, vibrant cyber-fantasy atmosphere.",
  flaggedKeywords: ["Disney", "Fortnite"],
  explanation: "Replaced Disney with 'whimsical, high-contrast cell-shaded 3D animation' and Fortnite with 'futuristic tactical gear with colorful glowing stripes' to prevent trademark infringement while preserving the playful, high-energy gaming aesthetic."
};
