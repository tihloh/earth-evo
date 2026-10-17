# Earth Evo UE5 — Sprint 01: Hybrid Planet Foundation

**Status:** Ready for development; **not started**.  
**Timebox:** 10 working days / 2 weeks (experienced Unreal C++ developer; adjust after machine/plugin inspection).  
**Strategy:** Dedicated UE5 Windows desktop codebase, new `earth-evo-ue5` repo **proposed, not yet created**. Preserve the browser repo intact.  
**Reference:** [Hybrid Architecture H-001](UE5-HYBRID-ARCHITECTURE.md) · [Dota 2–class performance contract P-001](UE5-PERFORMANCE-BUDGET.md) · [Migration Plan](UNREAL-MIGRATION-PLAN.md).

## Sprint objective

Prove the essential claim: **one Earth location has one stable meter-scale geographic identity across a coarse globe view and a higher-detail local tile**, with a modern measured-data input, a genuinely separate dated reconstruction input, and a synthetic fallback—all inspectable with evidence labels. Provide a runnable Windows proof of concept and objective tests.

Not in sprint: realistic animals, animated people, PCG biomes, full historical reconstruction, global rivers, high-end ocean waves, high-fidelity reflective water, complete planet quadtree streaming, 5×5 km explorable territory, or seamless production-quality orbit-to-ground flight. Those follow the core geography proof.

**Hardware performance gate:** shipping game targets **1080p/60 FPS**, **≤8 GB process RAM**, and a VRAM-safe preset on the user's i5-9400 / RX 5500 XT. These are unverified *targets*; Sprint 01 must obtain measurable baseline frame timing and memory on a real packaged UE5 executable before claiming success.

### Prioritized sprint backlog

| ID | Target | Work & concrete output | Dependency | Estimate | Done when |
| --- | --- | --- | --- | --- | --- |
| P01 | D1 | Establish baseline Performance preset (Lumen/hardware RT off), hardware VRAM probe, stat overlay and packaged-game profiling harness. | H01 (same day) | 0.5 d embedded within H01/H09 | FPS/frame-time/RAM/VRAM measured on i5-9400/RX 5500 XT; target budgets documented separately from editor resource usage |\n| H01 | D1 | Create pinned UE5 **C++** repository/project, Git LFS, UE ignore patterns and portable README. Record UE/SDK/toolchain versions and baseline PC/GPU. | None | 1 d | Editor project opens on Windows; clean clone builds; `Binaries/`, `DerivedDataCache/`, `Intermediate/`, `Saved/` excluded |
| H02 | D1–D2 | Implement `FGeoCoordinate`, `FECEFVectorMeters`, `FENUBasis` and geodetic↔ECEF↔ENU transforms using modern Earth reference ellipsoid (metric), including WGS84 datum references. | H01 | 1.5 d | Automation tests cover ±180°, poles, equator, height and round-trip precision without catastrophic centimeter error |
| H03 | D2–D3 | Define `FPlanetSnapshotKey`, `FGeoTileId(face,level,x,y)`, `FGeoQuery`, `FGeoSample`, `IPlanetGeographyProvider` and provenance enums; add source/versioned manifest schema. | H02 | 1 d | API compiles, serializes versioned metadata, rejects invalid coordinates/source ages |
| H04 | D3–D4 | Implement **deterministic synthetic** provider and small no-data fallback; produce geospatial golden fixture vs existing JS model for math checks (but **not** as claimed real geography). | H03 | 1 d | Same snapshot/lat/lon generates bitwise-stable tile IDs and sampled heights within numerical tolerance |
| H05 | D4–D5 | Add offline raster importer pipeline for **bounded NOAA ETOPO 2022** test subset, documenting vertical reference, resolution, SHA256 and attribution. Do not commit large/licensing-unclear raster. | H03 | 1.5 d | One modern test region loads locally at meter values; incorrect/missing tile drops to labeled fallback, not fake observed data |
| H06 | D5–D6 | Add **dated paleo fixture** adapter from selected verified EarthByte/GPlates polygon/rotation sample (e.g. 100 Ma); store plate/landmask validity and confidence. No general GPlates plugin yet. | H03 | 1 d | Query `age=0` routes to modern source; `age=100 Ma` routes to dated reconstruction; out-of-range date is explicitly hypothetical |
| H07 | D6–D8 | Build basic **cube-sphere globe mesh** plus one nested detailed tile sample from same `HybridGeoSource`; show age/date/source/confidence/elevation debug HUD. | H02–H06 | 2 d | At least two LODs; compared vertex samples agree, stable coastline classification, no arbitrary second terrain generator |
| H08 | D8–D9 | Create orbit/zoom/pan controller (left pan/right rotate/wheel) with geographic location selection and local tangent view; instrument camera altitude and target coordinates. | H07 | 1 d | Zoom from coarse sphere to finer regional tile and back with geographic identity preserved, no camera teleport; not yet fully seamless |
| H09 | D9–D10 | Automation tests, Windows packaged test build, measured FPS/memory log, demo screen capture, license/source ledger and first-sprint review. | All | 1 d | QA checklist below passes; clean release build runs without editor; blockers documented |

**Estimates** are approximate effort allocations, overlap possible, and depend on editor/plugin installs and obtaining legally usable small data fixtures. Stop and adjust scope if H02 or H05 fails; do not fake later gates.

## 10-day execution sequence

- **Day 1:** H01 + P01 resource-light engine settings, hardware inspection and baseline metrics + repository + first test. Preserve web app; prepare one baseline Windows packaged empty build.
- **Day 2:** H02 geodesy (double precision, ENU) with automated round trips at equator, high latitudes and dateline.
- **Day 3:** H03 provider contract + H04 deterministic fixture; record test numbers.
- **Day 4:** H04 complete + H05 begin NOAA local raster extraction pipeline.
- **Day 5:** H05 local modern test area demonstrates water/land/elevation in meters, provenance and fallback.
- **Day 6:** H06 age=100 Ma fixture with plate domains; show actual difference from age=0. **Never reuse a modern DEM as a fake paleomap**.
- **Day 7:** H07 coarse cube-sphere globe; verify face/corner orientation and consistent tile IDs.
- **Day 8:** H07 coarse/fine child tile + H08 controller; visualize dataset evidence color overlay and position.
- **Day 9:** H08 orbit-to-local and back; automated camera coordinate, mesh sample and LOD identity checks.
- **Day 10:** H09 demo build, 10-minute manual zoom/navigation smoke, performance log, data-license review, technical acceptance decision and Phase 1 backlog.

## Minimum deliverables and folder layout

```text
earth-evo-ue5/                          # separate repository proposed
  EarthEvo.uproject
  Source/EarthEvo/
    Public/Geo/GeoTypes.h
    Public/Geo/IPlanetGeographyProvider.h
    Private/Geo/GeoTransforms.cpp
    Private/Geo/HybridGeoSource.cpp
    Private/Geo/ProceduralGeoProvider.cpp
    Private/Geo/ModernRasterSource.cpp
    Private/Geo/PaleoFixtureSource.cpp
    Private/Planet/PlanetTileId.cpp
    Private/Planet/PlanetTileActor.cpp
    Private/Player/EarthPlayerController.cpp
    Private/Tests/GeoCoordinateTests.cpp
    Private/Tests/HybridSourceTests.cpp
    Private/Tests/PlanetTileTests.cpp
  Content/UI/                            # debug/provenance overlay first
  Config/
  Data/manifest.sample.json              # tiny synthetic fixture checked in
  DataExternal/                           # excluded, acquired local source crop
  Scripts/prepare_modern_dem.py
  Scripts/prepare_paleo_fixture.py
  Documentation/
    BUILD-WINDOWS.md
    SOURCE-LEDGER.md
    PERFORMANCE-BASELINE.md
    SPRINT-01-RESULTS.md
  .gitignore
  .gitattributes
```

These paths are **planned deliverables**, not created files. You can use a consolidated `EarthEvo` runtime module in Sprint 01 with logical namespaces. Split into plugins/modules only after compile/build times and interfaces justify it; don't create nine empty modules on Day 1.

### Baseline source manifest (JSON sketch)

```json
{
  "schemaVersion": 1,
  "worldSeed": 42,
  "planetModel": "WGS84-reference",
  "modern": {
    "datasetId": "NOAA-ETOPO-2022",
    "version": "2022",
    "mode": "bounded-local-cache",
    "heightUnits": "m",
    "verticalDatum": "dataset-declared",
    "licenseVerified": false,
    "sourceSha256": "<record-actual-hash-at-import>"
  },
  "paleo": {
    "datasetId": "EarthByte-GPlates-verified-fixture",
    "ageMyrBP": 100,
    "reconstructionModelVersion": "pin-exact-package-version",
    "licenseVerified": false
  },
  "fallback": {
    "provider": "EarthEvo-Procedural",
    "modelVersion": "0.1.0",
    "confidenceTag": "hypothetical"
  }
}
```

`licenseVerified: false` means **do not redistribute this sample dataset yet**. Replace placeholder values with actual metadata during implementation. The contract must preserve provenance for every tile.

## Definition of Done (all required)

### A. Numeric + geographic consistency

- Geodetic↔ECEF round-trip position error **≤1 cm in Cartesian meters** at reference cases (excluding ill-conditioned longitude at poles), with separate longitude-wrapping and polar handling tests.
- Globe and local child tiles share identical geography and coastline classification at all compared parent-grid sample positions for the same snapshot, tolerance **≤0.01 m** height discrepancy after both use the exact same sampler.
- Multiple requests for the same snapshot and tile return stable hashes; changing source version or epoch changes the cache namespace, not hidden globe-only data.
- Modern source heights are tagged with correct **vertical datum** and converted explicitly where physics needs ellipsoidal coordinates.
- Age 0 / dated paleo age / unsupported age return respectively `ModernObserved`, `PaleoReconstructed`, `DeepTimeHypothesis` or a clear insufficient-data error; unsupported cannot masquerade as observed.

### B. Actual Unreal playable artifact

- Windows executable opens and displays a spherical globe with a detailed inset/tile patch and debug legend.
- Wheel zoom, left pan and right rotate work; returning to the same geolocation preserves target location within **≤1 m** at LOD sample tests, not a promise of subpixel screen motion.
- On the chosen demonstration route, 10-minute globe→regional tile→globe loop produces no crash, visible blank/invalid tile, or invalid transform.
- Record GPU model, graphics settings, resolution, average and 1%-low FPS, per-tile generation latency, peak RAM and VRAM **without claiming a fixed performance target until hardware is measured**.

### C. Data and repository reliability

- Clean repository clone builds on the pinned toolchain and a Windows test executable launches.
- Small **legal-to-commit** synthetic fixtures and tests are in Git; large third-party/unknown-license data stay external until explicitly cleared.
- `SOURCE-LEDGER.md` records dataset ID, date validity, vertical datum, hash, license, attribution, confidence and cache provenance.
- All source-mode fallbacks visibly label `hypothetical` instead of silently inventing real historical terrain.
- Screenshot/video of **same geolocation at two LODs**, plus present-vs-100 Ma debug map output and known limitations in `SPRINT-01-RESULTS.md`.

### D. Review decision

**Pass:** H01–H09 artifacts and numeric/source tests completed on an executable. Approve Phase 1 expansion to real streamed globe/ground terrain, forest/sea biomes and larger benchmark zones.  
**Conditional pass:** no paid/proprietary data imports, but verified open fixtures + stable source architecture work; Phase 1 blocked on license provenance.  
**Fail/block:** globe and local sample different heights or silently substitute modern geography for paleo. Fix architecture before adding fauna.

## Risks and explicit fallback routes

1. **No UE5-capable development hardware / missing engine:** H01 blocks physical builds. Architecture and fixtures may progress outside editor, but do not claim a completed Sprint 01.
2. **Licensed paleogeography unavailable:** use a clearly `PaleoReconstructed` *test fixture* only if it is truly derived from dated reconstruction inputs. Otherwise label the geometry `DeepTimeHypothesis`. Do not fabricate authenticity.
3. **NOAA global dataset volume:** download/extract a **bounded test crop** and record source data; full 15 arc-second globe is out of sprint.
4. **Runtime dynamic mesh API performance/version uncertainty:** demonstrate a simple mesh in the supported engine API after compatibility review; no assumption of Nanite at runtime.
5. **Engine physics at planet scale:** keep physics local and double transforms global; don't enable every experimental engine plugin simultaneously.
6. **Scope creep:** wildlife, city building, water physics, and cinematic weather are Phase 2+; build one correct planet first.

## Expected sprint review demo (5 minutes)

1. Start packaged `EarthEvo.exe` on Windows, display pinned engine and GPU stats.
2. Orbit coarse globe, select a modern observed Earth location, inspect its `Dataset=ETOPO2022, age=0` label and elevation; zoom to finer tile at the same lat/lon.
3. Return to orbit without teleport; confirm coarse vs fine vertices match at shared coordinates.
4. Change time to `100 Ma`; see **dated reconstruction fixture** with appropriately scoped provenance/confidence, not modern terrain.
5. Change to unsupported deep time; see clearly hypothetical fallback (or explicit unsupported state).
6. Open logs: geodetic tests, source hashes, stable tile IDs, measured performance and build reproducibility.

**Next sprint recommendation:** streaming shell/terrain LOD, seam stitching, origin rebasing, 5×5 km collidable region, coastline and mountain horizon, and a stable 10-minute traversal test. After that, PCG biomes and water.
