# Earth Evo v0.6 — Era ecology, weather and physical geography

## What is simulated

Earth Evo is a **procedural educational sandbox**, not a fully validated reconstruction of real prehistory. Approximate stage gates are derived from the project's fictionalized 1,600-tick history; real fossil first/last appearances and biome distributions are more complex and geographically variable. The model deliberately avoids showing modern-looking mammals in the Cambrian or modern oak forests when land plants first emerge.

### Species by broad simulated period

| Stage (simulation ticks) | Representative catalog groups |
| --- | --- |
| 760 onward (Cambrian-like oceans) | Trilobite-like marine arthropods, then early fish |
| 870–1009 (land plant colonization to Permian-like era) | Early moss/clubmoss/horsetails, amphibians and early synapsid analogues |
| 1010–1149 (Mesozoic-inspired era) | Sauropod- and theropod-like dinosaurs, stegosaurs during part of the era, pterosaurs, emerging birds and conifers/cycads |
| 1150–1249 (early Cenozoic-inspired) | Deer, bison, elephants in suitable habitats, predators, diverse birds, flowering trees |
| 1250 onward (hominin stage to future) | Hominin/human analogues, later agriculture, historic, industrial, contemporary and hypothetical future cultural outfits |

Fossil windows are approximate. The named forms indicate simplified body plans and **do not imply that an individual named taxon occupied all locations or all dates within its period**.

### Creature form and behaviors

The renderer draws separate low-poly archetypes for **aquatic trilobites/fish/ammonoids**, **amphibians**, **synapsid-like early predators**, **sauropods, stegosaurs and theropods**, **pterosaurs and birds**, **mammoths/elephants**, **bison, deer, rabbits, wolves and lions**, and humans. Animal meshes keep the **+Z forward convention**, with four-legged gait, wing flapping, head and tail motions. They are stylized anatomies, not photorealistic or museum-reviewed reconstructions.

Agents follow a bounded rule-driven decision system that includes **foraging, thirst/drinking, resting, fatigue, predator avoidance, stalking/hunting, aquatic feeding, fishing, herding, socializing, resource collection and settlement construction**. Species have approximate speeds and habitats. Offspring inherit species identity and personality with some variation. This is still **not conscious AI** or rich natural-language reasoning. Individual memory is limited.

### Human appearance

Era-specific models distinguish basic prehistoric wraps, early farming woven/fur tunics, generic historic robes/tunics, industrial coats, contemporary clothing and speculative future suits. Temperature influences outfit selection. These are broad, culturally nonspecific prototypes—not historically exact clothing for every society or geography.

## Atmosphere and weather

In the local Actions HUD:

- **Fog style: None** — no atmospheric distance fog.
- **Atmospheric** — subtle aesthetic horizon haze, independent of weather.
- **Match weather** (default) — adaptive haze for clear/cloudy skies, rain, snow or dust.
- **Weather: Automatic** — simplified seeded updates to weather and wind. Override manually for clear, cloudy, rain, snow, windy or dusty visual conditions.
- Rain and snow draw light GPU point precipitation over the camera region. Weather remains simplified and does not model storms, cloud dynamics or precipitation grids.

**Fog of war no longer darkens unexplored terrain.** Exploration remains tracked for streaming state, but visibility is governed by **render distance + reduced mesh detail**. Performance rendering uses nearby 32-segment terrain tiles, 16-segment middle tiles and 4-segment distant tiles. Only nearby chunks instantiate/advance agents and vegetation. Underlying terrain sampling always uses `src/geography.js`.

## Landforms and bodies of water

`src/physical-features.js` defines a broad **28-entry landform vocabulary** and **17-entry water-body vocabulary**: mountains/ranges, ridges, volcanic/crater forms, plateaus/mesas, hills, valleys, canyons/gorges, cliffs, plains/basins, deserts/dunes, beaches, islands, peninsulas/capes/isthmuses, deltas, floodplains, marsh/wetlands, glaciers, and cave entrances; ocean/sea/bays/gulfs, straits/channels, lagoons, inland lakes/ponds, rivers/streams, estuaries/waterfalls, reefs, fjords and glacial inlets.

The shared synthetic Earth sampler distinguishes land, water, moist biomes and certain inland lakes/lagoons. `src/surface-view.js` constructs ocean surfaces and narrow/low-cost local freshwater polygons. `src/landform-view.js` places **sparse low-poly landmark cues** in the nearest tiles (rocks, crater rims, cave mouths, dune humps, glaciers, corals, waterfalls). The HUD displays a local classification at the camera focus.

**Caution:** A name in the classification catalog does **not** mean every geological formation is physically and hydrologically simulated. Cave interiors, true tectonic volcanoes, erosion, complete watershed routing, ocean waves, actual flood hydraulics, biologically realistic reefs and high-fidelity historical maps are future engineering milestones. Coastlines and named classes are synthetic and representative.

## Development source map

- `src/era-ecology.js` — taxonomy, approximate chronological gates, habitat selection, clothing archetypes and ecology transition boundaries.
- `src/physical-features.js` — classification and feature vocabulary.
- `src/landform-view.js` — sparse close-range physical feature meshes.
- `src/surface-world.js` — needs/goals and agent/ecological state.
- `src/creature-models.js` — species body plans, faces and animation joints.
- `src/vegetation-view.js` — instanced staged terrestrial vegetation.
- `src/surface-view.js` — local terrain LOD, optional weather fog, precipitation, water features and motion.
- `src/open-world.js` — active chunk ecology and cache.
- `src/geography.js` — canonical globe/ground coordinates and water/land samplers.
- `tests/era-ecology.test.js` — chronological/habitat tests.

See [GEOGRAPHY.md](GEOGRAPHY.md) for details of globe-to-ground agreement, coordinate conversion and its limitations.
