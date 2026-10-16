# Earth Evo v0.5 — World geography and open-world streaming

## One procedural geographic source

The globe renderer and local surface now use **the same sampler** in `src/geography.js`:

- `sampleGeography(latitude, longitude, seed, seaShift)`: canonical synthetic elevation, water/land, river channel, temperature, moisture and biome.
- `localToGeo(x,z,originLat,originLon)` and `sampleLocal(...)`: converts local ground coordinates back into the latitude and longitude of the selected globe location.
- `globeUVToGeo(u,v)`: matches Three.js SphereGeometry UV orientation to our planet-space `surfacePosition`. Longitude wraps cleanly at ±180°.
- `globeColor(sample, era)`: consistent terrain color classification across planet view and close-up world.

**Invariant:** for a given world seed, time/sea-level state and latitude/longitude, the underlying land/water classification and height are shared. The displayed globe is a 1536×768 raster and the local surface is a variable-detail mesh, so their visible pixel/triangle boundaries cannot be guaranteed identical at every zoom. The *sampled world* is the same.

**Scientific caveat:** the current planet is **synthetic**, not real Earth's coastlines, SRTM/ETOPO terrain, historically accurate plate tectonics, bathymetry or rivers. The exact-match goal is **across our two procedural representations**, not against measured Earth geography. Authentic historical geography is separate future work.

## Open-world regional coordinates

A chosen globe focus `(originLat,originLon)` anchors regional `(x,z)` coordinates. Positive x is east and positive z is south. Local world units map to small geographic angles; their unit scale is a gameplay approximation, not an exact kilometer-scale terrain/character simulation.

The region is not bounded by its original 180-unit scene. Camera panning updates the streamed tile center. `src/open-world.js` uses 48-unit chunks and a 5×5 radius for simulated nearby flora/fauna.

`src/surface-view.js` draws an independently configurable 2-, 3-, or 4-chunk visibility radius. Close tiles have higher mesh resolution; distant tiles are cheaper and fogged, including muted unexplored coloring. Geometry, material and entity instances are released as chunks are unloaded. Weather, settlements and wildlife still run as local, simple agents.

## Exploration and data retention

- The current nearby state lives in `SurfaceWorld`; it has real tree/creature/shelter objects.
- When the camera moves, distant active ecosystems are cached in bounded chunk snapshots (`streamCache`) and restored when you come back.
- The cache holds up to 96 chunks; evicted regions may be reconstructed procedurally. Evicted interventions or creature progression are **not guaranteed** to survive.
- World save/load includes seed, selected globe focus, current era, local active objects, explored/loaded chunk sets and the bounded chunk cache.
- Earth-scale population modeling remains aggregated in `src/simulation.js`; local creature actions are **not yet** fed back to the global population grid, and historical timeline rewind does not rewind all individual creature actions.

## Performance and next steps

- Keep a configurable view radius, simplified outer tile meshes and fog; do not render high-poly global terrain.
- Use seeded deterministic geography instead of independent terrain generators.
- Avoid recomputing the globe's full geographic samples every simulation frame; cache static values by world seed and recolor when necessary.
- Improve with a Web Worker for chunk construction, priority-based loading, spatial agent queries, texture atlases, GPU LOD and eventually persistent storage.
- For true Earth geography, use licensed gridded elevations/bathymetry and continental polygon/time-series datasets, preserving the same coordinate conversion in both views.

## Model orientation

`src/creature-models.js` defines the positive local **Z** axis as the forward direction. Quadruped torsos are elongated along Z, heads/neck extend toward +Z and legs attach to either side of the Z-oriented body. `src/surface-world.js` uses `atan2(dx,dz)` to align that local forward axis with the movement vector. Tests and visual checks should keep this convention when introducing new species.

## v0.8 — Nested terrain sampling and apparent continuous zoom

The globe texture and displaced planetary sphere and the living-world terrain are **different LOD representations** of a single deterministic geographic elevation sampler (`src/geography.js`). Every local terrain vertex is converted to geographic latitude/longitude using `sampleLocal()`, which calls `sampleGeography()`. Higher mesh subdivisions reuse the same seed and global field at denser spatial intervals.

`src/zoom-continuum.js` normalizes wheel deltas (pixels, lines, pages) and records inward zoom intent separately from OrbitControls. This ensures that reaching the planet camera's minimum orbit radius **does not prevent entering the local world**. `src/zoom-transition.js` defines hysteresis for returning to the globe, while `src/app.js` aligns the camera's geographic focus and applies a visually eased crossfade. This intentionally *fakes* one continuous zoom with two renderers, without breaking the world view's interaction model.

The living-world renderer now samples **4, 8, 16, 32, or 64 subdivisions** per terrain chunk depending on distance and camera zoom, while `src/horizon-terrain.js` provides a coarse extended horizon. These are powers of two for nested vertex alignment; a complete geomorphological skirts/morph algorithm for eliminating all LOD cracks has not yet been implemented.

The first headless WebGL browser test uncovered a real `TypeError: Assignment to constant variable` in the horizon triangle builder, which previously prevented entering living terrain. The triangle counter is now mutable, and `.github/workflows/browser-smoke.yml` exercises the wheel zoom to ground and back.

**What this does not guarantee:** Exact surveyed geography, real Earth scale ratios, physically limitless zoom, genuine fully shared global/individual population dynamics, or pixel-identical globe raster and detailed meshes at every resolution.
