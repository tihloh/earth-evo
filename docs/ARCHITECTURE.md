# Earth Evo — Architecture direction

## Goal
Create a web-based **interactive, multi-scale Earth evolution simulator**, evolving from planetary formation through biological ecosystems and eventually civilization, including alternate histories and futures.

## Three major domains

**Planet:** world grid, temperature, moisture, sea level, terrain, climate, resource fields, disturbances.

**Biology:** organisms/populations with energy, traits, heredity, reproduction, mutation, competition, niches, food webs and extinction.

**Civilization:** social groups, population, movement, farming, settlement formation, technology, resource production, institutions and interactions.

## Engine loop

Use a stable simulation clock decoupled from rendering:

1. Apply queued interventions and environmental events.
2. Integrate climate, hydrology and resource changes at appropriate time resolution.
3. Update organisms/populations and their interactions.
4. Update civilizations once they exist (at a separate slower cadence).
5. Generate a state snapshot for rendering and charts.
6. Check deterministic invariants and save periodic checkpoints.

When time accelerates, **simulate fixed domain steps** instead of advancing the visual clock without state updates. Long geological intervals need high-level aggregate models; individual agents only become relevant at appropriate scales.

## Data model (proposed)

- World: seed, simulation time, parameters, biome cells, event queue.
- BiomeCell: elevation, temperature, water, moisture, resources, aggregate populations.
- Species: inherited trait distributions, ecological niche, population and lineage.
- Organism: local position, age, energy, heritable traits, species (only for detailed regions).
- Civilization: population, culture, knowledge, settlements, technology, resources and relations.
- Event: time, type, location, cause, state change.

## Current v0.5 implementation

The app is modular. `src/simulation.js` handles deterministic planet-wide ecological populations and era navigation. `src/geography.js` defines **one seeded global geographic sampler** used by `src/renderer.js` (globe) and `src/surface-world.js` / `src/surface-view.js` (local landscape).

`src/open-world.js` streams creature/vegetation chunks around the moving regional camera. `src/surface-view.js` streams and fogs visible terrain LOD tiles. `src/creature-models.js` and `src/vegetation-view.js` draw more detailed low-poly figures and flora. `src/app.js` coordinates the UI, eras and save/load.

See [GEOGRAPHY.md](GEOGRAPHY.md) for latitude/longitude mapping, surface/globe agreement, fog-of-war-like streaming, bounded persistence, and geographic-data limitations.

This remains an **exploratory procedural simulation**, not scientifically faithful historical Earth geography, conscious AI, or a fully emergent civilization engine. Global aggregate populations and local individual actions have not yet been made into a single cross-scale causal system.

## Testing and performance

- Seeded replay gives identical final world state for the same parameters and tick count.
- Enforce bounded energy/resources/populations.
- Profile worker simulation separately from WebGL rendering.
- Avoid allocating geometry/objects each animation frame.
- Introduce spatial grids, entity culling and instancing before increasing agent counts.
