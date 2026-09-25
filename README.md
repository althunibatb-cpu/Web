# CLAUDE — Motion Reel 2026

A 15-second motion design showreel: six scenes, 32 beats at 128 BPM, 1080p60. There is no
footage, no After Effects project, and no stock audio. Every pixel and every sample comes from
code in this repo.

[![The sign-off frame of the reel](dist/poster.jpg)](dist/showreel.mp4)

**▶ [`dist/showreel.mp4`](dist/showreel.mp4)**, or open `reel/index.html` to watch it play live
in the browser (space to play, ←/→ to step frames).

## The cut

The whole piece sits on one beat grid. 15 s at 128 BPM is exactly 32 beats, and the visuals
and the score both key off it, so every cut lands on a hit.

| Beats | Scene | What it shows off |
|---|---|---|
| 0–4 | **00 · Ignition** | A point, a radius, then a circle drawn the way a compass would. Squash-and-stretch on the pen, rings on springs, and a scramble-text badge. It implodes back to a point on the downbeat. |
| 4–10 | **01 · Kinetic type** | A virtual camera whips across a typographic layout, one word per beat. Variable-font axes (Archivo `wdth 62–125`, `wght 100–900`) carry the animation. A live specimen readout annotates it. The camera then dives into the full stop, which *becomes* the next scene. |
| 10–16 | **02 · Shape & rhythm** | A 16×9 grid: dots → squares → a card-flip into Truchet tiles that re-route in waves. Each tile lets go, and the dots spiral into a phyllotaxis disc while an iris closes around them. |
| 16–21 | **03 · Particles in 3D** | The flat disc turns out to be a Fibonacci sphere seen head-on. It folds shut, spins up, re-forms as a (2,3) torus knot, and then the camera flies through it. |
| 21–25 | **04 · Real-time shaders** | Domain-warped fBm in the reel's palette, lit from screen-space derivatives. The type is refracted through the liquid with per-channel dispersion, shockwaves land on the kicks, and a vortex swallows it all. |
| 25–28 | **05 · Edit & pacing** | An accelerating tunnel. A recap on eighth notes, the name spelled out on thirty-second notes, then one beat-fraction of total silence before the hit. |
| 28–32 | **06 · Sign-off** | The point bursts into the name. It breathes for two bars, then folds back into the point the reel started from. |

Other details: the HUD shows the easing curve each scene is built on, with the beat running
through it as a dot. A beat ruler shows the bar position. Timecode is frame-accurate, and the REC
light blinks on the beat.

## How it's made

- **`reel/reel.js`**: the whole film as a pure function of time. `REEL.seek(t)` paints the
  frame at `t` seconds, across Canvas 2D, DOM typography (for real variable-font axes) and a
  WebGL2 fragment shader. The same code drives the live player and the renderer.
- **`tools/render.js`**: headless Chromium → PNG subframes → ffmpeg. Motion blur is true
  temporal supersampling with a 180° shutter. The sample count adapts to the choreography: 16
  subframes on whips and dives, 4 on calm passages. Hard cuts snap to frame boundaries so a cut
  never smears across two shots. Frames render as a queue of chunks across parallel workers into
  a lossless FFV1 master, which is then encoded to H.264 (BT.709) with fine temporal grain.
- **`tools/soundtrack.py`**: the score, synthesised with numpy/scipy. Kick, clap and hats;
  supersaw pads through moving filters with kick sidechain; FM bells; plucks; risers, whooshes and
  impacts; convolution reverb. Each cue is commented with the frame event it is scored to. The
  whoosh during the compass sweep pans around the stereo field with the pen, the camera whips get
  directional swooshes, and the letters of the name play the dominant chord that resolves on the
  final impact.
- **`tools/stills.js`**: renders single frames or contact sheets for review.

Palette: ink `#0C0C10` · paper `#F2EDE4` · vermilion `#FF4A1C` · ultramarine `#3A33FF` · acid `#D8FF3D`.
Type: Archivo (variable), Instrument Serif Italic, JetBrains Mono, all under the SIL OFL (see
`reel/fonts/`).

## Rebuild it

Requirements: Node 18+, Python 3 with `numpy` and `scipy`, Playwright's Chromium, and ffmpeg
with libx264 (`pip install imageio-ffmpeg` provides one; set `FFMPEG=` to use your own).

```sh
npm install                       # playwright
python3 tools/soundtrack.py       # → reel/audio/soundtrack.wav
node tools/render.js              # → dist/showreel.mp4   (≈22 min on 4 CPU cores)
node tools/render.js --draft      # quick 30 fps preview without motion blur
node tools/render.js --encode-only --crf 23 --grain 0 --out dist/web.mp4   # re-encode the master
node tools/render.js --patch 13.1-15   # re-render a time range and splice it into the master
node tools/stills.js --beats --every 1 --from 0.5 --to 32 --sheet --out stills   # contact sheet
```
