# Earth Evo ChatGPT project checkpoint — 2026-10-16, v0.8.1

## User evidence

User provided a 28.7-second screen recording of the post-v0.8 running app, `20261016-0701-41.8829267.mp4`. It showed globe-to-local zoom entering successfully, but the local view had **large visible square blue overlays**, disconnected-looking forest islands, abrupt shoreline edges, and different-colored distant terrain bands. Do not assume that successful zoom smoke tests validate visual quality.

## Root causes established in source

1. `src/surface-view.js` previously created a **transparent, full 48x48 ocean plane for every streamed terrain tile** even for tiles that contained land. Each material was chosen from the tile-center water category. Overlapping transparent planes created blue square edges and strong glare that appeared like floating land.
2. River/lake meshes filled whole grid squares when the center happened to be water, giving angular artificial shore boundaries.
3. Adjacent terrain chunks had 4/8/16/32/64 subdivisions without high-detail border interpolation; intermediate edge vertices could diverge from the coarse tile, producing T-junction seams.
4. The distant horizon mesh overlapped the detailed terrain footprint along portions of its inner ring, creating more rectangles.
5. The globe-to-ground focus was sampled at the **screen center** even when OrbitControls zoomed to the pointer, producing an unrelated sea location after aiming at land.

## v0.8.1 repairs (all on main)

- `src/water-view.js`: a single wide opaque ocean mesh, fixed to the zero-height sea-level datum, positioned around the camera with subtle shader waves. No transparent per-chunk ocean sheets; reduced harsh specular glare.
- `src/water-geometry.js`: pure geometric triangle clipping to generate river/lake polygons from canonical water samples rather than whole rectangular water cells.
- `src/surface-view.js`: integrates ocean once, tracks its position/time, uses clipped freshwater, computes neighboring tile LOD, stitches coarse/fine edge vertices.
- `src/terrain-lod.js`: generic deterministic sampled-edge interpolation and neighbor seam key.
- `src/horizon-terrain.js`: removes exact local-tile footprint from the distant horizon, avoiding geometry overlap.
- `src/app.js`: updates last globe wheel pointer position and chooses selected lat/lon at that position when descending.
- `tests/water-continuity.test.js` and `tests/terrain-seams.test.js` ensure ocean uniqueness, freshwater clipping and terrain border interpolation.
- Node CI and Chromium zoom in/out testing used as regression checks. Their success does not prove all terrain visuals match the user video expectations.

## Remaining limitations

This is still a synthetic Earth, stylized terrain and simplified water shading, not true physical ocean waves, spectral water reflection, measured bathymetry or exact realistic ecosystems. A real person should revisit visually challenging forest islands, cliff coasts, shallows and offshore tiles to verify the apparent seams are gone. Do not claim complete elimination of all visual artifacts without that review.

Project memory only, agent chatgpt; no secrets.
