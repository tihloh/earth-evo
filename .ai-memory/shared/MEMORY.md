# Earth Evo — Shared Project Memory

**Canonical non-sensitive project facts** · initial installation approved via the user's request on **2026-10-16**. Subsequent shared updates require review.

- [`tihloh/earth-evo`](https://github.com/tihloh/earth-evo) is a public browser-based 3D Earth evolution/civilization simulator on `main`.
- Long-term goal: progress from primitive Earth through ecosystems and human civilizations to speculative future outcomes; inspect regional life and intervene in god mode.
- Current **v0.4 prototype** has seeded aggregate planet simulation and rewind (`src/simulation.js`), a procedural local world with needs-based agents (`src/surface-world.js`), 3D views, creature models, vegetation, camera controls, compact HUD and general time scrollbar.
- The regional scene is **not** a geographically exact downscaling of the planet, and creature AI is **rule-based**, not consciousness or general human reasoning. Geological events and first appearances are simplified and may be milestone-gated.
- For implementation and limits, verify [README.md](../../README.md), [source](../../src), [tests](../../tests) and [architecture](../../docs/ARCHITECTURE.md).

**Security:** this repository is public. No secrets, private general memory contents or sensitive personal details.
