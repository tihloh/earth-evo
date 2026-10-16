# Earth Evo 🌍

**Earth Evo** is an experimental browser-based 3D Earth history and civilization project: starting with a young molten Earth, following life's emergence and biological diversification, then human settlement, civilization, and possible futures.

## Status

**v0.1 — interactive visualization prototype.** The current application illustrates 15 broad historical milestones on a procedural 3D planet. It is **not yet** a biological or civilization simulation: life indicators and historical transitions are stage-driven. Dates and planetary conditions are simplified; future scenarios are speculative.

## Run locally

No build step or backend is required.

1. Clone the repository:
   ```bash
   git clone https://github.com/tihloh/earth-evo.git
   cd earth-evo
   ```
2. Start a static server:
   ```bash
   python -m http.server 8000
   ```
3. Open [http://localhost:8000](http://localhost:8000) in a modern WebGL-capable browser.

The browser needs an internet connection for Three.js from its pinned CDN.

## Controls

- **Drag** the globe to orbit; **scroll** to zoom.
- Use the **timeline** to scrub between early Earth and a hypothetical future.
- **Previous / Next** jump between milestones.
- **Play / Pause** and the **speed** selector control progression.

## Development principles

1. **Simulation core independent of rendering:** time-stepped deterministic world state with seedable random numbers.
2. **Emergent behavior over scripted milestones:** ecological interactions, reproduction, inherited traits, selection, speciation and extinction.
3. **Multi-scale design:** planetary climate and biome grid, regional populations, and local agents; aggregate populations at planetary scale.
4. **Reproducibility:** stable seeds, tests, snapshots, and save/load.
5. **Browser performance:** Web Workers for heavy simulation, typed arrays, instancing/LOD for rendering.
6. **Scientific transparency:** separate evidence-informed settings from hypothetical or gameplay mechanisms.

## Proposed roadmap

- [x] Phase 0: Interactive 3D globe, timeline, era information, symbolic life markers.
- [ ] Phase 1: Fixed-step simulation engine, seed, independent state, pause/resume and save/load.
- [ ] Phase 2: Regional terrain, temperature, moisture, water and resources.
- [ ] Phase 3: Self-replicating organisms, inheritable traits, mutation, death and selection.
- [ ] Phase 4: Ecosystem food webs, migration, speciation and extinction.
- [ ] Phase 5: Hominin populations, culture, settlements, farming and demographic dynamics.
- [ ] Phase 6: Cities, technologies, trade, diplomacy, disasters and alternate futures.

## Suggested future structure

```text
src/
  core/           # deterministic simulation loop, state, events and RNG
  planet/         # geometry, terrain, biomes and climate
  biology/        # organisms, populations, genetics and food webs
  civilization/   # social groups, settlements, technology and economy
  rendering/      # Three.js scenes, LOD and camera
  ui/             # controls, charts, inspection
tests/
docs/
```

Keep the initial prototype small while validating the simulation rules before adopting a more complex app framework.

## Stack

- JavaScript + WebGL
- [Three.js](https://threejs.org/) for 3D rendering
- Static HTML/CSS; currently no npm dependencies or server

## Scientific note

Life's origin is still an unresolved research question. Future self-replicating agents will use an explicitly **hypothetical computational origin-of-life model**, not claim to recreate the actual origin of terrestrial life. Simulating 4.5 billion years with every individual organism is computationally infeasible; this project must use different levels of abstraction as needed.
