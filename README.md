# Earth Evo 🌍
### A web-based 3D Earth evolution & civilization sandbox

**Earth Evo** is an interactive simulation prototype that follows a fictionalized, science-inspired Earth from planetary formation (~4.54 billion years ago), through the emergence and diversification of life, to human settlements and hypothetical futures.

**Current status: v0.5 — unified procedural planet, streamed open-world terrain, fog-of-war LOD, and corrected animal orientation.** It includes a navigable planetary globe, a close-up procedural regional world with autonomous creatures, and a simplified worldwide ecosystem/civilization simulation. It is **not** a physically accurate 4.54-billion-year reconstruction, a full Darwinian genetics simulator, or a Civilization-scale strategy game.

## Run it

**You don't need to install a JavaScript framework or database.**

Clone:

\`\`\`bash
git clone https://github.com/tihloh/earth-evo.git
cd earth-evo
\`\`\`

Start a local static server with Python:

\`\`\`bash
python -m http.server 8000
\`\`\`

Open **http://localhost:8000** in a current WebGL-enabled browser. Internet connectivity is required for the pinned Three.js import-map modules downloaded from jsDelivr.

To use Node's built-in simulation tests, with Node 22+ installed:

\`\`\`bash
npm test
\`\`\`

If you want the app hosted as a static website, this project can also be served via GitHub Pages: Repository **Settings → Pages → Build and deployment → Deploy from branch → main → /(root)**. Pages must be enabled by someone who can edit the repository settings.

## Two levels of exploration

**Planet view:** Rotate the Earth and use the **general timeline scrollbar** to navigate from Earth's formation to a hypothetical future. Click a location on the globe to select it, then click **Explore surface** or zoom in until the regional 3D view opens.

**Surface view:** Orbit or right-drag to pan across a tile-streamed open world. The camera loads nearby terrain and releases distant tiles, with distant terrain faded into fog. See low-poly humans, animals, birds, forests, mountains, rivers, shorelines, islands, and huts. Use **Return to planet** to leave.

**The globe and open-world terrain now share exactly the same deterministic elevation/biome function** (`src/geography.js`) at matching latitudes and longitudes. Coastline, land/water, river classification, and sampled height agree at the underlying geographic coordinates. The globe uses a **1536×768 raster**, while the local terrain uses streamed geometry of varying tessellation, so their visible pixel edges and triangles may differ slightly at a given zoom.

**Important:** This is a **fictional procedural planet**, not a surveyed Earth. It does not yet use authentic landmasses, USGS/NASA elevation models, plate-tectonic reconstructions, or actual modern river networks. Matching the two game views is not the same as matching real geography.

The global and local **ecosystem simulations remain different scales**. Local agents and God Mode changes are not yet persisted back into the aggregated planet model. Scrubbing into a different major era rebuilds the local scene, and the local world runs independently while you explore.

### Creature autonomy

Local creatures are not simple animated loops:

- **Herbivores** graze, forage, flee nearby predators and reproduce.
- **Predators** search for prey and hunt when hungry.
- **Birds** fly, forage and avoid dangers.
- **Humans** explore, seek food, hunt, gather timber, deliver supplies, socialize, escape predators and construct shelters when materials are available.
- **Trees** regenerate food, can be consumed or harvested, and slowly disperse seeds.

Each individual has different **curiosity, courage, sociability and diligence**, keeps rudimentary memories of food and danger, and acquires simple survival or crafting experience. The inspector shows their current goals, motivations, hunger, energy and learned skills. This is **rule-based utility/goal AI, not consciousness, reasoning language models or independent artificial general intelligence**.

### God Mode

In the surface view choose a power in the right sidebar, then click the landscape:

- **Inspect:** Pick a creature or shelter; follow a selected creature with the camera.
- **Grow forest / Grow food / Bring rain:** Supply plants and food or boost fertility.
- **Add grazer / predator / bird / human:** Introduce new creatures (subject to era restrictions).
- **Place shelter:** Intervene directly in settlement development.
- **Lightning:** Harm nearby organisms and trees.

Set the regional simulation to **1×, 4× or 10×**, or pause local life while keeping the 3D camera interactive.

## Open-world streaming and fog of war

- The visible landscape is generated on demand in **48-unit terrain chunks** from your selected globe coordinates. Chunk edges use the same coordinate sampler as the globe.
- Nearby chunks use higher-detail geometry. Outer tiles use simplified meshes and muted unexplored styling; atmospheric fog masks distant draw limits.
- **Visibility** in the top toolbar controls the terrain ring: Fast (2), Balanced (3, default), or Far (4). The two-ring inner ecosystem contains individual trees and agents; distant ecology is cached or recreated deterministically.
- The camera can pan far beyond the original 180-unit square. The world streams as you move; there is no single fixed map edge within the supported coordinate range.
- Exploration state and nearby active ecology are included in Save/Load; distant chunk snapshots have a bounded cache (96 chunks) for browser memory safety. Evicted areas can be reconstructed procedurally, but older player modifications there may not be preserved.
- This is an efficient procedural **fog-of-war-like streaming prototype**, not yet an infinite physically simulated planet, asynchronous disk-backed world, or a full undiscovered-map exploration system.

## Camera navigation and compact HUD

**The world view now fills the central workspace**, and small translucent HUD panels float over it instead of occupying permanent sidebar columns.

- **World HUD** toggles planetary conditions, species information and civilization statistics.
- **Actions HUD** toggles the creature inspector, events and interactive god powers.
- **General timeline** is a slim bottom strip to keep historical navigation available while leaving more room for the 3D scene.
- **Left-drag / one-finger drag** orbits the view; **right-drag / two-finger pan** moves the focus point.
- **Wheel / trackpad zoom** is anchored toward the pointer in both planet and regional views; terrain tiles stream as the local camera pans.
- **Camera glide** defaults to **Precise (2%)**: the orbit controller applies approximately 98% of an input on its first 60 Hz update, with 2% residual damping. The toolbar also offers **None (0%)** and **Soft (5%)**. These percentages describe *residual motion*, not a measured accuracy guarantee.
- Idle planet rotation is turned off. The selected world stays still when you stop manipulating the camera.
- Camera panning is confined to the local map while you explore the detailed terrain.
- From surface view, select **Return to planet** for a deliberate switch of scale.

### Detailed procedural vegetation and animals

The regional biome now uses multiple recognizable tree species—**oak, birch, pine, cedar, palm, acacia, willow and mangrove**—plus **ferns, shrubs, grasses, reeds, flowers and heather**. Their placement is influenced by slope, nearby water, temperature era and moisture estimates. Vegetation is instanced into GPU-efficient draw groups.

People now have individual low-poly heads, skin tones, hair, clothing, limbs, faces and optional backpacks/headwear. Grazers and predators use four-legged articulated models with eyes, ears, snouts, tails, paws/hooves and optional antlers. Birds use beaks, eyes, tails and animated articulated wings. The models are **original procedural stylized meshes**, not photorealistic assets or named real-world animal species.

## Controls

- **General timeline scrollbar:** Drag the compact bar at the bottom **both forward and backward** from 4.54 billion years ago through a hypothetical 2200 CE. **The simulation state** rewinds/restores, not only the displayed date.
- **Milestone marks:** Click any marker to jump to an important period.
- **Start / Future:** Jump to either end of the timeline.
- **−1 / +1:** Step time forward or backward by one *simulation tick* (ticks represent different spans of actual geological time).
- **‹ Era / Era ›:** Jump directly between major geological or cultural eras.
- **Play / Pause:** Advance simulated time automatically.
- **Speed:** Select slow, normal, fast or very fast playback.
- **3D globe:** Drag to rotate, click to select a region, and scroll to zoom. Colored dots represent **aggregated** biological abundance, and gold dots represent settlements, not individual organisms.
- **Detailed region:** Continue zooming to explore moving creatures, trees and buildings at ground level. Use the right-hand god tools to interact with life.
- **Change the world:** Raise/lower global climate, change sea level, trigger volcanic eruptions or asteroid impacts.
- **Seed / Reset:** Generate a reproducible alternative planet.
- **Save / Load:** Download a JSON save and restore it later. Saves contain the planet seed/time/interventions and, where compatible, active local agents, flora, shelters and bounded exploration snapshots. No account or backend is needed.

### Simulation layers

1. **Planet:** Procedural sea/land terrain, latitude-based climate, moisture, fertility, oceans and interventions.
2. **Biology:** Aggregate microbial, plant, grazer, predator and hominin populations; environmental fitness, food supply, local carrying capacity, diffusion/migration, extinction and occasional inherited-trait lineage branching.
3. **Civilization:** Hominin-dependent settlement founding, population, farming/resource stocks and a shared technology index. Human societies evolve differently across seeds and interventions.

### Honest limitations

- First appearances of major biological guilds are *milestone-gated* based loosely on history. Life's real origin is scientifically unresolved. **Natural selection and speciation are approximated; complex anatomical evolution is not modeled.**
- The globe represents aggregate biological populations as colored dots; **individual low-poly humans, animals, birds, trees and huts are rendered in the local scene**. Rich anatomical changes, actual dinosaurs, lifelike behavior, and fully modeled urban infrastructure remain future work.
- Populations and temperature/oxygen indicators are conceptual units, **not official paleoenvironmental or demographic statistics**.
- Planet generation is procedural rather than a true reconstruction of historical continental drift.
- Time is *nonlinear*: 1 tick near Earth's formation covers vastly more real years than 1 tick near the present.
- Future states are speculative; they are not predictions.
- Large-scale multi-agent behavior, detailed society, cities, trade, diplomacy and interplanetary travel are **future work**.

### Project structure

\`\`\`text
index.html               Browser application
src/
  app.js                 UI, timeline, multiscale navigation and controls
  simulation.js          Reproducible global world/ecosystem/civilization core
  renderer.js            Three.js planet and markers
  geography.js           Canonical seeded globe and regional elevation, river and biome sampling
  open-world.js           Nearby ecosystem streaming, discovery and bounded chunk cache
  surface-world.js       Geolocated creature AI and local ecology
  surface-view.js        3D terrain, creature instances, buildings and camera
  creature-models.js     Articulated, procedural humans, quadrupeds and birds
  vegetation-view.js     Instanced trees and biome ground cover
  camera-controls.js     Shared cursor zoom, pan and 0/2/5% glide tuning
  styles.css             Responsive styles for planet, local explorer and timeline
tests/
  simulation.test.js     Node tests for rewind/replay, seeds and interventions
  surface-world.test.js  Terrain, autonomy, intervention and reproducibility tests
  camera-controls.test.js Camera response and panning bounds tests
docs/
  ARCHITECTURE.md        Long-term engine plan
.github/workflows/
  test.yml               Automated simulation test workflow
\`\`\`

### Roadmap

- [x] 3D globe, era labels and configurable playback
- [x] **General timeline scrollbar** with past/future seeking and era shortcuts
- [x] Deterministic world engine, seeded populations and time-state rewind
- [x] Simplified ecosystems, inherited trait variation and ecological extinction
- [x] Simplified settlement and technology dynamics
- [x] Climate/impact intervention controls, save/load, automated tests
- [ ] Biological agents with richer genetics, organisms, anatomies and life cycles
- [ ] Real-world modern and prehistoric continents/DEM datasets, plate tectonics and higher-fidelity climate
- [x] Procedural local 3D terrain, river, islands, varied forests and detailed animated low-poly wildlife
- [x] Zoom-to-surface navigation, inspector, god powers and creature following
- [x] Cursor-focused precision zoom, optional 0–5% glide, panning and compact collapsible HUDs
- [ ] More detailed 3D organisms, species-specific environments, cities and infrastructure
- [ ] Detailed human civilizations, trade, conflict, governments and technologies
- [ ] Space-age civilizations and long-term multi-planet simulations
- [ ] Scalable worker-based simulation with spatial LOD and persistent databases

## Technical design

Both global and regional simulation engines are standalone ES modules without browser or Three.js dependencies. The renderer consumes world state independently. Reproducible seeds, cached snapshots, discrete simulation ticks and an intervention log make reversible navigation practical. Testing uses Node's native test runner; browser rendering uses Three.js 0.186.1 from a pinned CDN version.

## License

No license has been selected yet. All rights reserved by default until a license is added.
