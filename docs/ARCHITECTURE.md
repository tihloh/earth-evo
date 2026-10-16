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

## Prototype boundary

The current `index.html` is a lightweight visual demonstrator. It keeps all logic in one file intentionally. **Do not mistake its milestone transitions for emergent evolution.** The first substantive refactor should extract the deterministic simulation clock and state, while leaving the existing 3D presentation functional.

## Testing and performance

- Seeded replay gives identical final world state for the same parameters and tick count.
- Enforce bounded energy/resources/populations.
- Profile worker simulation separately from WebGL rendering.
- Avoid allocating geometry/objects each animation frame.
- Introduce spatial grids, entity culling and instancing before increasing agent counts.
