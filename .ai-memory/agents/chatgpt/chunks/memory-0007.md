# ChatGPT Earth Evo checkpoint — lightweight UE5 target (2026-10-17)

User explicitly requires the new Unreal Engine 5 desktop Earth Evo to be **as light on system resources as Steam Dota 2**. This is a **performance constraint** that takes priority over cinematic UE5 features, not an exact hardware-usage guarantee.

**Reference PC:** Intel Core i5-9400, 32 GB DDR4, Radeon RX 5500 XT (4 GB/8 GB variant unconfirmed), SSD. Target the **packaged Windows game**, not UE Editor/compiler runtime: provisional **1080p/60 FPS**, fallback 30 FPS, **prefer 4–6 GB game process memory, aim ≤8 GB peak**, **≤3 GB dedicated GPU VRAM** if 4 GB card, optional Balanced ≤5 GB GPU memory on 8 GB card. These are **unmeasured targets**.

Default low-cost engine graphics: **no hardware ray tracing or Lumen GI/reflections**, simple sky/direct lighting, screen-space/reflection captures, limited physics/cloth, deterministic world tile LOD/horizon culling, instanced species/foliage, bounded near-full-AI agents, cheap aggregate distant ecology/settlements, async streaming. Do not delete persistent distant life to optimize. Benchmark against actual Dota 2 gameplay on same PC at matching resolution before claiming equivalence. Dota 2 Steam's 4 GB minimum system RAM is not its actual running memory.

Actions:
- New project repository `tihloh/earth-evo-ue5` was empty; initialized README with hybrid geography architecture/performance contract and .ai-memory/agents/chatgpt/MEMORY.md. **No Unreal C++ project or compiled game yet**.
- Original repo docs: `docs/UE5-PERFORMANCE-BUDGET.md` and updated `docs/UE5-HYBRID-ARCHITECTURE.md`, `docs/UE5-SPRINT-01.md`, README.
- Need confirm RX 5500 XT **4 GB or 8 GB VRAM**, available SSD space and Unreal build environment; first packaged build should log FPS/RAM/VRAM and streaming hitches.

Follow no-secrets policy. Agent-specific write namespace only.
