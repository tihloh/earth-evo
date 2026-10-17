# Earth Evo UE5 — Dota 2–Class Performance Contract (P-001)

**Selected:** 2026-10-17. **Status:** target requirements for the Unreal Windows game, **not measured results**. The Unreal project has not been built. See [Hybrid Architecture](UE5-HYBRID-ARCHITECTURE.md) and [Sprint 01](UE5-SPRINT-01.md).

## Product mandate

The user wants Earth Evo to be **about as lightweight to run as Steam Dota 2**, while still simulating an evolving globe, terrain, wildlife and settlements. This is an engineering priority, not a promise of identical actual resource usage. Dota 2's Steam **4 GB minimum system RAM requirement** is *not* a measurement of Dota's peak game-process RAM, and the complexity of planet-scale evolution is different from a bounded multiplayer arena.

**Confirmed reference PC:** Windows desktop, Intel Core i5-9400 (6 cores/6 threads), **32 GB DDR4**, **AMD Radeon RX 5500 XT 4 GB VRAM**, SSD. **The shipped game** must be benchmarked separately from the Unreal Editor, shader compilation and packaging.

### Presets and first performance targets

| Shipping preset | Purpose | 1080p frame rate | Process RAM budget | Approximate dedicated VRAM budget | Notes |
| --- | --- | --- | --- | --- | --- |
| **Performance** (default on RX 5500 XT 4 GB) | Smooth navigation / low overhead | **60 FPS target**, allow player-selected 30 FPS cap | **Prefer ≤6 GB, aim ≤8 GB peak** | **Aim ≤3 GB** on 4 GB card | Limited active actors, reduced materials/reflections, 75–85% internal render resolution with spatial upscaling if useful |
| **Balanced** (optional; must benchmark on 4 GB GPU) | Slightly improved close-up visuals | **30–60 FPS subject to measurements** | **Aim ≤8 GB peak** | **Remain ≤3 GB on this machine** | Only increase individual settings where verified to fit; never assume 8 GB hardware |
| **Quality** | For stronger GPUs in future | Hardware-dependent | Separate measured budget | Hardware-dependent | Enhanced water, shadows, foliage/lighting; not recommended as default on RX 5500 XT 4 GB |

**Target vs gate:** these are aspirational first benchmarks, not minimum spec guarantees or a scientifically measured estimate. Sprint 01 reports actual timings/memory; failing to reach a budget means lower the default quality or redesign the hotspot, not publish an untrue “Dota 2 performance” label. Users may choose a 30 FPS cap for lower power/heat.

### Locked RX 5500 XT **4 GB** baseline — conservative first preset

- **VRAM:** target **≤2.5 GB typical, never intentionally budget above 3.0 GB peak dedicated VRAM** for the packaged game; leave approximately **1 GB headroom** for OS/display driver, render targets, transient allocations and other processes. These are engineering allocations, not verified measurements.
- **Texture streaming:** start with **~1,024–1,280 MiB texture-pool cap**, profile before adjusting; the pool is only *one component* of total VRAM. No large uncompressed 4K terrain/animal/vegetation textures on this preset.
- **Rendering:** 1920×1080 display output at **75–85% internal resolution** initially; compare practical TAA/FXAA or other economical AA/upscaling options after measuring. Hardware ray tracing, Lumen GI/reflections and cinematic virtual-shadow/water settings are **off by default**.
- **Frame target:** build toward **60 FPS** in well-optimized views, with **30 FPS stable fallback** in demanding local ecosystems. Record frame pacing and 1%-low results; do not sacrifice world-state correctness.
- **Actors:** only a bounded near-camera set of richly animated creatures; start with **≤20 full-skeletal agents in the representative performance scene** as a tunable test budget, not an absolute design limit. Distant life becomes aggregates or instanced animation proxies.
- **Measurements:** package a Windows build and log real GPU memory usage, including spikes while zooming orbit→ground and while rendering coastline, forests, water and settlements. Revise all numbers based on that evidence.

## Architecture choices required to approach the target

1. **Disable hardware ray tracing and Lumen GI/reflections by default** for the reference RX 5500 XT; use inexpensive direct sunlight, sky light, baked lighting where compatible, ambient approximations, reflection captures or selective SSR. UE's Low scalability disables Lumen. No automatic Cinematic/Epic graphics preset on startup.
2. **Single source of geography** but **different computational representations**: cheap globe mesh at orbit, screen-error-based coarse terrain from afar, fine streaming tiles only around the camera. Child meshes replace parent tiles once loaded; hard memory budgets, async tile generation, view/horizon/occlusion culling. No all-planet Nanite scene.
3. **No planet-scale Actor spam**: offscreen humans/fauna are aggregated in compact data; update world history at low frequency. Nearby life may become MassEntity agents; only a small, budget-limited set of skeletal characters gets full AI/animation each frame.
4. **Tiered simulation rates:** player-adjacent active entities 10–20 decisions/s when necessary; mid-distance 1–2 decisions/s; far away aggregated minutes/years-per-update (depending on time acceleration). Render tick != ecology tick. Maintain persistence and deterministic outcomes. Prioritize actual gameplay interactions.
5. **Foliage:** deterministic regional PCG rules (terrain slope, altitude, soil, moisture, species era) generate instanced meshes (HISM/ISM where appropriate), GPU LOD/culling, impostors/billboards for distant trees. Avoid spawning a full Actor per blade/tree.
6. **Terrain budgets:** screen-space error LOD, tile pool, prefetch by camera velocity, cancel obsolete tile jobs, cache compressed height/biome data, share meshes/textures, seamless LOD skirts/morphs; limit runtime CPU mesh generation per frame.
7. **Water & reflection budgets:** single global low-cost sea representation + regional water surface only near observers, simplified waves at distance, selected near-shore shading, avoid multiple full-scene reflection captures or ray-traced mirror seas.
8. **Physics:** local collision islands, no planet-wide physics; distant animals/settlements use lightweight state transitions rather than costly navmesh/rigid bodies.
9. **Animation:** skeletal rigs and behavior complexity prioritized for inspected/nearby creatures; far fauna use pose/mesh impostors with LOD updates. Deactivate IK, cloth, facial morphs, complex shadows beyond useful screen size.
10. **Rendering defaults:** favor forward or economical deferred renderer after benchmarking both on the chosen UE5 version; low shadow cascade count, short dynamic-shadow range, texture streaming and resolution scaling, efficient color grading/fog. More realistic colors/geometry must not require high-end lighting systems.
11. **Adaptive settings:** automatically lower internal resolution, foliage draw distance, nearby full-animation count and water quality if sustained frame time exceeds target; user has override and can lock chosen FPS.
12. **Threading:** avoid work that blocks the game thread. Time-cap tile builds per frame and simulation updates; use async tasks/worker jobs, bulk buffers, pooled meshes, measured cancellation behavior.

## Measurable acceptance on reference PC

Benchmark a **packaged Development/Shipping game** (never use UE Editor as the resource baseline). Test at **1920×1080** with AMD driver version, Windows version and actual VRAM size recorded.

- Scenarios: (A) global Earth orbit, (B) fast globe→ground zoom, (C) coastal forest/river/settlement with representative life, (D) fast 10 km local fly/pan, (E) 30-minute accelerated ecological simulation, (F) save/reload/return to prior location.
- Capture **average FPS, 1%-low FPS, median/p95 frame time, game-thread/render-thread/GPU timings, per-process peak committed/working-set RAM, dedicated/shared VRAM, SSD read/streaming spikes**, time-to-first-frame and engine initialization.
- Sprint 01 is a baseline-only gate, not a guarantee of 60 FPS in a fully populated world. At milestones for living terrain, compare the **same scene on Performance preset** with Dota 2 captured on the same PC at the same resolution/preset, noting that workload and art style differ.
- Provisional target: **60 FPS average** and near 16.7 ms per rendered frame in most tested Performance scenes; **≤8 GB game process RAM peak**; dedicated VRAM headroom for the **confirmed 4 GB RX 5500 XT** (initial goal ≤3 GB peak, preferably ≤2.5 GB typical); avoid obvious hitches >100 ms when zooming/streaming. Reassess budgets with measured content density.
- If performance falls below target, simplify first: cloud/fog cost, water reflections, foliage/character draw calls, shadow passes, geometry density, active agents, terrain generation. **Never reduce geographic correctness or lose persistent world state** as a performance shortcut.
- Disk/build costs: UE **editor/toolchain** are substantially larger than the shipped product. Keep runtime download/install size separate from development storage, set a project-specific size budget once measured; do not imply this must equal Dota 2's 60 GB store requirement.

## Sprint changes required

Add a new task **P01 (day 1)**: create default Performance preset, hardware/VRAM probe and budget overlay (FPS, frame time, process RAM, GPU memory, current terrain tiles and full-detail actor count) and ensure a packaged benchmark binary can print results.

Extend **H07–H09**: always profile coarse globe, coarse/fine terrain transition and local tile, even with placeholders. Reject “looks realistic” demos that lack CPU/GPU/RAM evidence. Build configurations should be reproducible and lower-end GPU settings run by default.

## Confirmed development capacity constraint — 10 GB free SSD

The reference PC's SSD currently has **approximately 10 GB free**, making **local UE5 editor/compiler installation and builds infeasible without more storage**. This does not change game performance goals or guarantee the packaged desktop game fits on that drive. Sprint 01 must use a larger **additional/external SSD** for local UE development or a Windows remote build runner with sufficient engine/toolchain capacity. The private repository's default GitHub-hosted Windows runner (~14 GB SSD, 8 GB RAM, 2 vCPU, no UE engine installed) is unsuitable for full UE5 builds; reserve it for lightweight tests. Cloud builds require an actual configured Unreal-capable builder, costs and credentials approved by the user. Track build-machine disk usage **separately** from packaged-game RAM/VRAM/FPS and final install footprint.

## Known unknowns

- **VRAM capacity confirmed: RX 5500 XT 4 GB.** Verify exact driver version, shared-memory reporting and actual dedicated-memory use on the development PC.
- Confirm **free SSD space** and whether this PC will build Unreal locally or GitHub Actions will run on a separately provisioned Windows Unreal build runner.
- Dota 2 Steam minimum: https://store.steampowered.com/app/570/Dota_2/ (minimum specs, *not measured gameplay*).
- Unreal Lumen performance and Low scalability: https://dev.epicgames.com/documentation/unreal-engine/lumen-performance-guide-for-unreal-engine
- UE hardware recommendations: https://dev.epicgames.com/documentation/en-us/unreal-engine/hardware-and-software-specifications-for-unreal-engine

**This resource-light requirement takes priority over photorealism or the number of simultaneously simulated high-detail Actors.** Progressive detail, correct habitats and persistent aggregate simulation are more important than costly effects.
