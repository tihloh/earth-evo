# Earth Evo project AI memory

Project-specific memory for [tihloh/earth-evo](https://github.com/tihloh/earth-evo), enabled on accepted `main` for development threads through [config.yaml](config.yaml).

Read the [instructions](INSTRUCTIONS.md), [rules](RULES.md), [shared facts](shared/MEMORY.md) and then **your own** `agents/<id>/MEMORY.md`, followed by at most two relevant memory chunks. Use private cross-project memory in `tihloh/ai-memory` only if authorized.

The repository is **public**: everything committed to `.ai-memory/` is publicly readable. Do not copy secrets, sensitive data or private general-memory content here.

Initially only ChatGPT's own namespace is populated. Other authorized AIs can read it but must create/write **only their own** namespace, unless the user explicitly approves a cross-agent edit. Shared-memory/policy updates require review.

These are development assistant memories; they are **not** the simulated creatures' in-world cognition (`src/surface-world.js`). Sync is a best-effort checkpoint during an active development session, not a guaranteed background service or platform-native memory update.

See [sync workflow](SYNC.md), [onboarding](ONBOARDING.md), and [size rules](MEMORY-SIZE.md).
