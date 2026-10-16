# Earth Evo ChatGPT implementation checkpoint — 2026-10-16

**Agent:** chatgpt · **Status:** source-backed milestone; not a live-browser visual validation. Main branch, version 0.4.

## Confirmed requirements
- Web-based 3D simulation of Earth's geological origins through life and human civilization into speculative futures.
- General timeline bar that seeks forward/backward, plays and jumps between eras.
- Planet-to-region zoom, terrain, oceans, mountains, rivers, islands, trees and ground cover; humans, animals and birds move and behave with local agency.
- God-mode changes (rain, trees, food, animals, settlements, lightning) and inspection/follow camera.
- Precise orbit/pan/zoom with low drift (0%, 2%, 5% residual glide) and compact collapsible HUD.

## Implemented code and meaningful decisions
- `src/simulation.js`: seeded aggregate planetary cells, stage-gated initial guilds, ecological populations, lineage variation, extinction, settlements, interventions, and cached world snapshots for rewind.
- `src/surface-world.js`: separate procedural region with character energy/hunger, needs-driven activities, temperament (curiosity/courage/sociability/diligence), remembered food/threats and learned skill scores. Hunting, foraging, fleeing, timber gathering and shelter building use simple rules.
- `src/surface-view.js`, `src/creature-models.js`, `src/vegetation-view.js`: Three.js close-up region with rivers, mountains, islands, eight stylized tree types, multiple ground plants and low-poly articulated humans/quadrupeds/birds.
- `src/renderer.js`, `src/camera-controls.js`: 3D globe, camera panning, cursor-focused zoom and 98% immediate input response by default (2% residual); no idle rotation.
- `src/app.js`, `src/styles.css`: general time bar, save/load, world/surface controls and compact floating HUD. User explicitly prefers more screen space for the 3D scene.
- Tests under `tests/` and CI under `.github/workflows/` cover deterministic world, regional goals and camera controls.

## Known limitations and open work
- Stage-gated historical first appearances; not scientifically faithful abiogenesis or exact historical geography.
- Local world is an independent regional sandbox; god actions and individual behaviors are not yet fully consistent with global species across timeline rewinds.
- Intelligent actions are **rule-based**; richer planning, social organizations, complex languages, tool invention, cultures and true emergent civilizations remain goals.
- Procedural low-poly assets, not photorealistic. The real browser UI and frame-rate have not been comprehensively validated.
- `docs/ARCHITECTURE.md` was created before refactoring and may be outdated; inspect live code.
- Proposed next: browser tests for HUD/zoom, durable cross-scale ecological history, deeper agent memories/learning, improved navigation/pathfinding, simulation workers and LOD.

## Maintenance
After substantial development changes, verify the code and append concise dated updates within ChatGPT's project agent namespace. Rotate to the next chunk if the new entry would exceed 6,144 UTF-8 bytes, and update the index. Never claim automatic background sync or expose private global memory here.
