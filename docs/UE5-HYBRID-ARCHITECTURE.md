# Earth Evo UE5 — Hybrid Planet Architecture (Decision Record H-001)

**Decision:** APPROVED DESIGN DIRECTION · 2026-10-17  
**Scope:** Windows-first Unreal Engine 5 desktop evolution simulator, modern measured Earth + reconstructed geological epochs + procedural physical evolution.  
**State:** Architecture finalized for Sprint 01; **no UE5 source project, dataset bundle, plugin integration or playable executable has been built**. See [Sprint 01](UE5-SPRINT-01.md) and the wider [UE5 Migration Plan](UNREAL-MIGRATION-PLAN.md).

## 1. Non-negotiable principles

1. **One canonical Earth state**: camera, global globe mesh, ground tiles, water, habitat, collisions, wildlife, events, epoch, and saves sample one versioned world model.
2. **Modern Earth is measured; paleo-Earth is reconstructed** where supported. Never pass modern topography, rivers or human assets off as scientifically accurate prehistoric geography just by moving today's continents. Do not present deep-time procedural output as measured.
3. **Metric reality**: WGS84-style ellipsoid for the modern reference planet; source elevation / ocean depth and physics in meters; Unreal world positions in centimeters (1 UU = 1 cm). Visual vertical exaggeration is optional and **disabled by default**; it must not alter water/physics.
4. **No full-Earth high-detail rendering**: distant Earth is coarse; nearby geometry streams by screen-space error. High-detail wildlife and settlements are simulated/rendered only near observers, with persistent aggregate and save state at distance.
5. **Graceful source fallback**: missing data downgrades confidence and produces clearly classified procedural fill. Never silently display present-day coastlines for a prehistoric epoch.
6. **Offline procedural mode** works without Cesium ion, Epic cloud, or remote imagery. Dataset-driven modern-Earth mode uses **locally preprocessed licensed source tiles**. Cesium may be an adapter for present-day reference imagery, not the authoritative historical world.
7. **Visual consistency + provenance**: every globe and regional mesh calls the same geographic sampler and tile ID at the same epoch, seed, edits and source versions. Differences in screen resolution may exist; a coastline or height cannot change simply because the camera crossed an LOD boundary.

## 2. Geographic/time conventions (locked)

- Planet core data are double-precision **ECEF meters** and geodetic `latitude_deg, longitude_deg, height_m`. Normalize longitude across ±180°; explicitly test poles and zero sea level.
- Local near-ground frame is **East–North–Up (ENU)** around an ECEF origin. Place/transform actors using cm only at this boundary. Implement deterministic rebase when observer movement threatens precision; do not assume all Niagara/material/physics paths preserve 64-bit precision.
- Physics uses 1× elevations; camera/graphics are 1× by default. A cinematic height exaggeration slider could be introduced later but does not affect simulated coordinates.
- **Time** is `age_myr_bp` as a nonnegative `double` for geological eras (0 present; 100 = 100 million years before present), supplemented by a separate calendar/near-future field where relevant. Do not infer geological dates from the web prototype's 0–1600 milestone tick. The web timeline needs an explicit versioned migration map.
- `PlanetSnapshotKey = (world_seed, age, source_set_version, procedural_model_version, committed_change_revision)`. Terrain requests for that snapshot are immutable and independently reproducible.
- Spatial IDs use `face (0..5), level, x, y` on a **cube-sphere quadtree**. Cube-face edge mapping must be exact; no separate local RNG geography.
- Source heights are stored in meters and tagged with a vertical reference/datum. ETOPO's mean-sea-level-style elevation and WGS84 ellipsoid height are **not interchangeable**; conversion model and metadata are explicit. The first sprint documents both frames and tests a known datum sample before using measured heights for physics.

## 3. Hybrid data authority and reconstruction rules

| Epoch / confidence class | Authoritative inputs | Output rule |
| --- | --- | --- |
| `ModernObserved` (age = 0, and only epochs with valid measurement semantics) | NOAA ETOPO 2022 global bedrock/bathymetry and ice-surface variants; optionally regional measured DEMs | Preprocess and sample authentic heights/depths, known coastlines and datum, then add **small** local detail without moving validated shoreline or summit heights beyond a declared tolerance |
| `PaleoReconstructed` (within explicit dataset validity interval) | EarthByte/GPlates plate rotations, reconstructed plate/land polygons, reconstructed sea-level indicators and paleogeographic layers **where available** | Reconstruct dated continental domains and plate motion; derive new age-specific orogeny, basins, volcanism and elevations procedurally under geological/sea-level constraints; never simply warp modern DEM values into the past |
| `DeepTimeHypothesis` (outside coverage or scientifically unconstrained) | Geological period constraints, planetary physics, uncertain continent/crust distributions | Generate explicitly hypothetical surface and mark low confidence. Do not use a secretly fixed present-day map |
| `FutureSimulated` | Last valid baseline plus simulation events | Apply simulated tectonic/climate/sea-level/biological/settlement changes, with uncertainty rising into the future |

**Important transition policy:** Geological time is not a naive numeric blend between an accurate modern DEM and a speculative paleo DEM. Interpolate **plate transformations, time-indexed geological drivers, modelled uplift/erosion and supported source snapshots** in their valid intervals. Preserve topology/land-water constraints and mark uncertainty. At source switches, compute a **geologically meaningful transition or crossfade of rendered representations** without claiming intermediate morphology is measured. New historical periods may require new geographies, not only appearance changes.

For the first sprint the paleo source is a *small, dated test fixture* whose data agreement is checked. Full GPlates reconstruction import is a later milestone. No large external dataset is committed to Git without explicit provenance and license review.

### 3.1 Authoritative sampler (pseudocode contract)

```cpp
enum class EGeoEvidence : uint8 {
    ModernObserved, PaleoReconstructed, DeepTimeHypothesis, FutureSimulated
};

struct FGeoQuery {
    double LatitudeDegrees, LongitudeDegrees;
    double AgeMillionYearsBeforePresent; // 0 == present
    uint64 WorldSeed;
    FGuid SourceSetVersion, ModelVersion;
    uint64 ChangeRevision;
};

struct FGeoSample {
    double GroundElevationMeters;      // with datum metadata
    double SeaSurfaceMeters;          // geoid/MSL-reference level
    double OceanDepthMeters;          // >= 0 where ocean, otherwise 0
    double SignedDistanceToCoastMeters;
    FVector3d SurfaceNormalECEF;
    EGeoEvidence Evidence;
    double Confidence01;             // source/data confidence, not probability of a specific landform
    FName BiomeKey;
    FName DatasetId;
    FName VerticalDatumId;
    uint64 SnapshotHash;
};

class IPlanetGeographyProvider {
public:
    virtual bool Sample(const FGeoQuery& Query, FGeoSample& Out) const = 0;
    virtual ~IPlanetGeographyProvider() = default;
};
```

This is an **interface specification, not compiled UE5 code**. In production, implement tile-wise async batch sampling rather than invoking a virtual function for every pixel. Terrain, water and biome consumers read one `FGeoSample`. Ocean/river/slope/habitat decisions derive from it and never maintain independent geology.

### 3.2 Source adapters and precedence

```text
HybridGeoSource
  ├── EpochPolicy (date → valid source domain + provenance)
  ├── ModernElevationProvider [NOAA ETOPO 2022; tile cache]
  ├── ModernRegionalDEMProvider [optional higher-res, versioned override]
  ├── PaleoPlateProvider [GPlates/EarthByte offline preprocessed fixtures]
  ├── ProceduralGeologyProvider [seeded uplift, basins, volcanoes, erosion]
  ├── ClimateHydrologyProvider [drainage, precipitation, sea level]
  ├── EditOverlayProvider [persistent authored/simulated changes]
  └── GeoTileCache [snapshot-keyed, bounded + cancellable requests]
```

**Order:** resolve date and data validity → reconstruct geographic domains → choose authoritative available elevation/constraint → apply permitted procedural residuals → compute sea level/water/drainage/climate → apply persistent edits → return final sample with evidence and datum. Unknown data must not be assigned high confidence. Ocean biome viability requires depth and connected-water classification, not simply any water pixel.

## 4. Unreal software modules and dependencies

```text
EarthEvo (Game module; UMG + player/controller)
  ├── EarthCore: seeds, deterministic clock/epoch, event log, saves
  ├── EarthGeo: geodesy/datum, source adapters, provenance, tile IDs
  ├── EarthGeology: planet physics, uplift, eruption, erosion, water basins
  ├── EarthStreaming: cube-sphere quadtree, adaptive LOD, task scheduler
  ├── EarthTerrain: terrain meshes, stitching, collision, local origin
  ├── EarthClimate: weather, rivers, oceans, biomes, habitat
  ├── EarthEcology: populations, MassEntity/StateTree agents, food webs
  ├── EarthCivilization: settlement resources, structures, culture/time
  └── EarthPresentation: UMG, cameras, rendering, debugging/provenance
Adapters (optional, independently switchable)
  ├── CesiumModernReferenceAdapter
  └── LicensedDatasetImporters (offline preparation step)
```

- **C++** owns deterministic planet state, math, tile scheduling and tests. **Blueprints and Data Assets** author species, biomes, material rules, animation graphs, settlement templates, epoch labels and player UX.
- **Planet renderer:** custom cube-sphere quadtree with screen-space-error and bounded async tile generation. Parent tile remains until replacement is available; morph/stitch neighbors, cull behind the horizon, cancel obsolete work, record memory/CPU/GPU telemetry.
- **UE World Partition/HLOD:** use for **regional Actors, towns and authored environmental assets**, not as the standalone global spherical terrain manager. Avoid a second independent height database.
- **Runtime terrain mesh:** prototype with Epic-supported mesh APIs; benchmark carefully. Some procedural mesh component APIs are flagged experimental in Epic's documentation. **Nanite for suitable static/imported geometry**; do not depend on assumed runtime Nanite support for procedurally updated tiles.
- **Cesium for Unreal:** optional modern-reference feature. Coordinate adapters must map its ECEF/georeference to EarthGeo, and disabling Cesium must not stop offline synthetic/paleo play.
- **Near-world materials:** biome PCG, slope-accurate rock/soil, ocean level, rivers, beaches, physically plausible reflections with graphics presets, atmospheric visibility instead of black fog-of-war.
- **Simulation:** aggregate global state + regional ecology + active individual skeletal models. MassEntity handles scalable agents; StateTree handles behavior, with precise habitat and era validity rules. Persistent agent identity doesn't depend on a rendered Actor's lifecycle.

## 5. Seamless zoom & physical scale

**Control contract:** left-drag pan, right-drag rotate, mouse wheel zoom; configurable camera glide with **0% default** for the new desktop prototype (2% and 5% optional). UI compact by default, accessible keyboard alternatives.

- Camera stores canonical ECEF observer position/orientation + target; zoom moves along a continuous geographic ray as tile LOD refines, not through an unrelated regional world.
- Display globe at high altitude; schedule child tiles based on projected screen error and camera velocity. Continue to load coarser parent while high-resolution child is not ready. Use geometric morph/crossfade **inside one geographic hierarchy**.
- When approaching a chosen region, shift physics and local rendering into a georeferenced ENU frame. This is a transform, not a gameplay teleport. Maintain world space location, angle, speed and temporal state.
- Make actor scale physically correct: e.g. human height ~1.7 m, tree species-specific, mountains kilometers high. Ocean level and collision agree at both scales.
- Do not confuse precision/LODs with infinite spatial resolution; define a fixed maximum local detail per graphics preset. During distant flight show landforms from simplified geo tiles, not all tree geometry.

## 6. Data provenance / licensing rules

Required source ledger fields:
`dataset_id, provider, asset_uri, version, publication_date, coverage_bounds, age_range_myr_bp, resolution_m, horizontal_datum, vertical_datum, uncertainty_class, license_text_or_url, attribution, redistribution_allowed, offline_allowed, SHA256, processing_pipeline_version`.

Suggested vetted candidates (to validate **per tile and data product** before actual redistribution):

- NOAA **ETOPO 2022**: global topography/bathymetry; bedrock vs ice surface are distinct products. <https://www.ncei.noaa.gov/products/etopo-global-relief-model>
- EarthByte **GPlates 2.4 datasets**: rotation model, continental boundaries and paleogeography; model validity/uncertainty varies by epoch. Dataset-specific reuse/attribution must be checked. <https://www.earthbyte.org/gplates-2-4-software-and-data-sets/>
- Cesium for Unreal: ECEF/georeferencing and modern 3D Tiles support; streaming agreements and offline permission must be verified independently. <https://cesium.com/learn/cesium-unreal/>
- UE5 LWC/World Partition/API compatibility should be pinned to chosen minor engine version; official docs: <https://dev.epicgames.com/documentation/en-us/unreal-engine/large-world-coordinates-in-unreal-engine-5>

**No raw high-resolution global raster downloads in Git.** Maintain a small committed synthetic fixture and a separately acquired, properly attributed bounded real-data fixture where redistribution permits; everything else comes from a reproducible offline converter and optional local external data directory.

## 7. Release gates & decision log

**First 2-week sprint gate** (details in [Sprint 01](UE5-SPRINT-01.md)):
- UE C++ project builds; canonical WGS84-like geodetic/ECEF/ENU conversions pass tests, including dateline and poles.
- Distinct source modes `modern / paleo / hypothetical` return stable samples with provenance; limited modern data tile and dated paleo fixture actually load locally; missing data gracefully falls back.
- One coarse globe and one finer tile patch are generated from the **same** sampler; matching shared vertices, altitude, land/water and same stable seed. Camera zoom can inspect both without world-position teleport. No full seamless planet promised yet.
- A **Windows packaged executable** starts; screen recording and debug overlay show time/source/confidence, measured FPS and memory.
- License/source manifest reviewed, known data gaps recorded, web prototype unchanged.

**Next milestone** (not Sprint 01): continuously streamed 5×5 km playable regional world, ocean/river mesh, local physics, true LOD stitching, mountain horizon, collision and 10-minute orbit-to-ground cycle.

**Architecture decision record:**
- H-001 Hybrid historical/modern geography — **selected**.
- H-002 Planet tile format: cube-sphere `face/level/x/y` — **selected for prototyping**, benchmark before production freeze.
- H-003 Standalone game offline first — **selected**.
- H-004 Cesium optional modern-Earth adapter — **selected**.
- H-005 Dataset licensing before distribution — **required**.
- H-006 Unreal minor version and procedural mesh path — **pending 2-day compatibility spike**.
