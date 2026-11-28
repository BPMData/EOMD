# Kit changelog

## 0.1.0 (2026-11-28)

First kit.

- `fx/lens.js`: the WebGL2 finish over a 2D canvas:
  - glow from up to 6 levels at halving sizes, mixed in linear light;
  - halation, streak, and a colour fringe that grows toward the edges;
  - tone curve (none, ACES, AgX) and grade (contrast, saturation, lift, gain);
  - vignette, grain weighted to the midtones, and an anti-banding dither;
  - with every knob at 0 the picture passes through pixel-exact.
- `audio/dsp.js`: EOMD's DSP:
  - synthesis, effects, loudness, true peak, limiter;
  - `P.steps.*` generator twins (sample-identical to the plain functions), `P.drain` and `P.runAsync` for synthesis
    on the main thread in ~8 ms slices.
