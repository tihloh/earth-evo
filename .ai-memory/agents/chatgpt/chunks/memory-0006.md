# ChatGPT Earth Evo project checkpoint — 2026-10-17 (hybrid UE5 locked)

**Task:** User explicitly chose the hybrid authentic Earth and evolving procedural geology approach and requested finalized UE5 architecture and first development sprint.

**Planning committed to current `tihloh/earth-evo` main:**
- [`docs/UE5-HYBRID-ARCHITECTURE.md`](../../../../docs/UE5-HYBRID-ARCHITECTURE.md): approved hybrid decision H-001; modern measured NOAA ETOPO global relief when available, GPlates/EarthByte reconstructions within dataset validity, procedural relief filling unknown ages/locations and supporting evolving fictional geology. Per-sample evidence labels/uncertainty, source hash/license/vertical datum; do **not** pretend present DEM is paleo-Earth.
- [`docs/UE5-SPRINT-01.md`](../../../../docs/UE5-SPRINT-01.md): prioritized 10-day first sprint H01–H09. Begin with separate Windows C++ UE5 repo (proposed `tihloh/earth-evo-ue5`, **not created yet**), geodetic/ECEF/ENU meter-scale math and tests, canonical geography provider, synthetic fallback, bounded modern real relief fixture, verified paleo dated fixture, coarse globe + same-coordinate fine child tile, zoom control, packaged demo and benchmarks.
- [`docs/UNREAL-MIGRATION-PLAN.md`](../../../../docs/UNREAL-MIGRATION-PLAN.md) now points to finalized architecture and sprint; README links to both.
- One physically meaningful planet system: source-aware geodetic doubles, local ENU physics, cube-sphere tile IDs/LOD, shared sampler for globe & ground, persistent edits, data-driven ecology and historical eras.
- Controls: **left mouse pan, right rotate, wheel continuous zoom**, near-zero default camera glide.
- Cesium plugin optional modern-reference adapter, not mandatory for fictional planet/offline historical play. World Partition/HLOD for local authored/settlement content, **not a complete spherical planet renderer**.
- Epic LWC APIs and dynamic runtime mesh path to be version-pinned/tested; exact UE version not yet selected.
- **Important status:** only documentation/planning exists; no UE5 repository, compiled project, working desktop executable, downloaded dataset tiles, or source license approval yet. Don't claim otherwise.

**Future work:** obtain or confirm workstation hardware and installed Unreal toolchain; create UE project and accomplish H01–H09; do not divert immediately into 60+ animals and cities before planet-data correctness.
