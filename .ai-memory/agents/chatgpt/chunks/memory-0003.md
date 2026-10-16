# ChatGPT Earth Evo Project Checkpoint — 2026-10-16 (v0.8)

**Source-backed status:** Direct commits to public `tihloh/earth-evo` on `main`; actual headless Chromium/WebGL smoke test for zoom descent and ascent passed after fixing a renderer exception.

## Requested behavior and implementation

- User repeatedly reported **unable to zoom from globe into the living regional world**. They explicitly approved using a visual trick that replaces/resamples terrain at successively higher detail, resembling Minecraft-style deterministic chunk terrain, as long as it *appears to be one seamless zoom*.
- Actual root cause was **not only zoom threshold**: `src/horizon-terrain.js` initialized `tris` with `const` then incremented it. Chromium test produced `TypeError: Assignment to constant variable` while constructing terrain on every attempted entry. Fixed to `let tris=0`.
- `src/zoom-continuum.js` now normalizes trackpad/wheel deltaMode, accumulates inward zoom intent independent of OrbitControls' camera radius, and provides deterministic near/medium/far detail selection. The globe cannot silently hit a zoom wall; a short handoff uses aligned view cameras and a crossfade.
- `src/surface-view.js` supports nested **4/8/16/32/64 terrain subdivisions** from the same lat/lon sampler, with inexpensive distant mountain mesh and near-camera detailed ecology; local zoom minimum lowered to inspect animals.
- `src/app.js` catches terrain initialization errors, restores globe controls, shows actual failure instead of leaving `localActive` stuck, and supports inward wheel handoff and outward zoom return.
- The right/left mouse mapping remains **left pan, right rotate, wheel zoom**.
- Added `tests/browser-zoom.mjs` and `.github/workflows/browser-smoke.yml`. Real browser smoke test confirmed zoom **globe → living terrain → globe** with WebGL; Node simulation tests also pass.
- See `docs/GEOGRAPHY.md` and README for cross-scale geographic agreement and known limits.

## Explicit limitations and future work

This is a **crossfade between two different renderers**, not a continuous mathematically single mesh or true limitless zoom. Local geography is deterministic, synthetic and shared with the global sampler, but raster/mesh edge discrepancies, LOD cracks and real-scale geographic inaccuracies remain. Plants, animals and settlements are still simplified procedural representations. Do not claim photorealism, historical fidelity, or all-scale persistent autonomous ecology.

Do not store secrets. Continue writing only to this agent-owned namespace.
