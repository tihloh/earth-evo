# Project memory size and rollover

Follows the private general `tihloh/ai-memory/MEMORY-SIZE.md` standard.

- `shared/MEMORY.md` and each `agents/<agent-id>/MEMORY.md`: **≤4,096 UTF-8 bytes**.
- Detailed `chunks/memory-NNNN.md`: **≤8,192 UTF-8 bytes**.
- Roll over to next chunk **before an append would exceed 6,144 bytes**; keep previous chunks discoverable from index.
- When necessary, move historical chunk listings to linked `index/INDEX-NNNN.md` pages, each ≤4,096 bytes.
- Read indexes first, then at most two relevant chunks initially.
- No secret storage, cross-agent writes without scoped authorization, or shared edits without review.
- GitHub checks verify structure/sizes only—not truth, ownership, or absence of all secrets.
