# Earth Evo 🌍
### A web-based 3D Earth evolution & civilization sandbox

**Earth Evo** is an interactive simulation prototype that follows a fictionalized, science-inspired Earth from planetary formation (~4.54 billion years ago), through the emergence and diversification of life, to human settlements and hypothetical futures.

**Current status: v0.2 — interactive simulated sandbox.** It is a working, fully navigable 3D demonstration with deterministic ecological populations and a simplified civilization system. It is **not** a physically accurate 4.54-billion-year reconstruction, a full Darwinian genetics simulator, or a Civilization-scale strategy game.

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

## Controls

- **General timeline scrollbar:** Drag the large bar at the bottom **both forward and backward** from 4.54 billion years ago through a hypothetical 2200 CE. **The simulation state** rewinds/restores, not only the displayed date.
- **Milestone marks:** Click any marker to jump to an important period.
- **Start / Future:** Jump to either end of the timeline.
- **−1 / +1:** Step time forward or backward by one *simulation tick* (ticks represent different spans of actual geological time).
- **‹ Era / Era ›:** Jump directly between major geological or cultural eras.
- **Play / Pause:** Advance simulated time automatically.
- **Speed:** Select slow, normal, fast or very fast playback.
- **3D globe:** Drag to rotate and scroll to zoom. Colored dots represent **aggregated** biological abundance, and gold dots represent settlements, not individual organisms.
- **Change the world:** Raise/lower global climate, change sea level, trigger volcanic eruptions or asteroid impacts.
- **Seed / Reset:** Generate a reproducible alternative planet.
- **Save / Load:** Download a JSON replay recipe and restore it later. Saves include the seed, time and intervention history. No backend account is needed.

### Simulation layers

1. **Planet:** Procedural sea/land terrain, latitude-based climate, moisture, fertility, oceans and interventions.
2. **Biology:** Aggregate microbial, plant, grazer, predator and hominin populations; environmental fitness, food supply, local carrying capacity, diffusion/migration, extinction and occasional inherited-trait lineage branching.
3. **Civilization:** Hominin-dependent settlement founding, population, farming/resource stocks and a shared technology index. Human societies evolve differently across seeds and interventions.

### Honest limitations

- First appearances of major biological guilds are *milestone-gated* based loosely on history. Life's real origin is scientifically unresolved. **Natural selection and speciation are approximated; complex anatomical evolution is not modeled.**
- Individual creatures, dinosaurs, humans and buildings are **not rendered**. Planetary-scale abundance is shown by colored dots, and settlements by golden points.
- Populations and temperature/oxygen indicators are conceptual units, **not official paleoenvironmental or demographic statistics**.
- Planet generation is procedural rather than a true reconstruction of historical continental drift.
- Time is *nonlinear*: 1 tick near Earth's formation covers vastly more real years than 1 tick near the present.
- Future states are speculative; they are not predictions.
- Large-scale multi-agent behavior, detailed society, cities, trade, diplomacy and interplanetary travel are **future work**.

### Project structure

\`\`\`text
index.html               Browser application
src/
  app.js                 UI, timeline and controls
  simulation.js          Reproducible world/ecosystem/civilization core
  renderer.js            Three.js globe and markers
  styles.css             Responsive theme and timeline
tests/
  simulation.test.js     Node tests for rewind/replay, seeds and interventions
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
- [ ] Continental movement, plate tectonics and higher fidelity climate
- [ ] 3D visual ecosystems: plants, animals, cities and infrastructure
- [ ] Detailed human civilizations, trade, conflict, governments and technologies
- [ ] Space-age civilizations and long-term multi-planet simulations
- [ ] Scalable worker-based simulation with spatial LOD and persistent databases

## Technical design

The simulation is in a standalone ES module without browser or Three.js dependencies. The renderer consumes world state independently. Reproducible seeds, cached snapshots, discrete simulation ticks and an intervention log make reversible navigation practical. Testing uses Node's native test runner; browser rendering uses Three.js 0.186.1 from a pinned CDN version.

## License

No license has been selected yet. All rights reserved by default until a license is added.
