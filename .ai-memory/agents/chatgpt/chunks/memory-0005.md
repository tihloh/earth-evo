# ChatGPT Earth Evo Planning Checkpoint — 2026-10-17

**Owner:** ChatGPT · **Status:** architecture plan only, no UE5 implementation. **Source:** `docs/UNREAL-MIGRATION-PLAN.md`.

User asked to plan migrating Earth Evo to **Unreal Engine 5** as a **realistic planet-scale Windows desktop evolution simulator**.

Decisions/recommendations recorded in project:
- Keep existing `tihloh/earth-evo` Three.js web prototype working and propose a separate `tihloh/earth-evo-ue5` repository; none has been created yet.
- **One authoritative C++ planet coordinate/geography/simulation state** across orbital globe, tile LOD, ground terrain, fauna, flora, civilizations and save data. Use real metric scale, geodetic double coordinates and local tangent-origin physics.
- Custom spherical quadtree for planetary terrain; UE World Partition/HLOD for appropriately scoped terrestrial content; PCG for biomes; MassEntity/StateTree for wildlife; Water System for regional rivers/lakes; scalable Lumen/Nanite for suitable rendered assets.
- Cesium for Unreal is **optional** for georeferencing/reference modern Earth terrain, not the core changing geological planet. Modern real-earth datasets do not automatically reconstruct prehistory.
- Port data/rules from `src/geography.js`, `src/simulation.js`, `src/surface-world.js`, `src/era-ecology.js`; replace Three.js renderers and stylized procedural asset geometry with UE5 systems and authored content.
- Preserve user controls: **left mouse pan, right mouse rotate, scroll wheel continuous zoom**.
- Strict gate: first 5x5 km geographically matched island/valley, one fast globe-ground-globe transition, convincing mountain/ocean/river and limited but correct wildlife, persistence and performance tests. Start small before species/settlement expansion.
- Performance and fidelity are measured targets, not promises. Existing browser geography/time are illustrative/synthetic and not scientifically accurate Earth or exact scale.
- Staged phases and acceptance criteria in `docs/UNREAL-MIGRATION-PLAN.md`; Windows 11 hardware sizing and license review before selecting engine/plugins. **Plan only; do not claim a new UE project has been created.**

Avoid secrets and do not write other agent namespaces.
