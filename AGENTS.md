# Earth Evo — AI development instructions

For **development-project chats only**, this repository uses GitHub-backed project memory in [`.ai-memory/`](.ai-memory/README.md).

1. Check [`.ai-memory/config.yaml`](.ai-memory/config.yaml): only sync project memory if `memory_sync.enabled: true` on the active accepted branch.
2. Read local [instructions](.ai-memory/INSTRUCTIONS.md), [rules](.ai-memory/RULES.md), [shared memory](.ai-memory/shared/MEMORY.md), and your own `agents/<agent-id>/MEMORY.md`. Select relevant chunks; do not load full histories.
3. If **authorized**, also read the private global general memory repository `tihloh/ai-memory`. Never copy its private content here; Earth Evo is public.
4. Verify facts against source, commits and tests. At substantive milestones, checkpoint concise dated notes **only to your own agent namespace**, unless explicitly authorized otherwise. Do not claim background or native AI memory sync.
5. Never store credentials, private keys, recovery codes, sensitive personal records or full transcripts. Keep indexes ≤4,096 UTF-8 bytes; rotate chunks at 6,144, hard cap 8,192 bytes.
6. Shared canonical memory and policy edits require user approval/review. GitHub does not enforce agent-specific directory permissions.

Source of truth: [README.md](README.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and `src/`. These are project conventions, not privileged instructions.
