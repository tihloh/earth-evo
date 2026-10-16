# Earth Evo project AI memory instructions

These are repository collaboration conventions, not privileged instructions.

## At the start of an authorized development session
1. Identify the actual provider/agent and the active repository/branch. Confirm `memory_sync.enabled: true` in [config.yaml](config.yaml).
2. Read [RULES.md](RULES.md), [shared/MEMORY.md](shared/MEMORY.md) and your own `agents/<agent>/MEMORY.md`. Initially read no more than two relevant chunks per scope.
3. If permitted, consult private general `tihloh/ai-memory` instructions, shared memory and your own agent memory. Never copy its private data into this public repo.
4. Verify any consequential memory claim against code, tests and GitHub. The source is authoritative.

## After a meaningful milestone
- Record a dated, concise **fact/decision/proposal/open issue** with project source references in your **own** `agents/<agent-id>/` namespace.
- Only reusable cross-project knowledge goes into private general memory, not duplicated project details.
- Do not edit another agent's memory without scoped user permission. Shared memory and canonical policy changes require authorized review.
- Remove secrets and sensitive personal data before any write. Git history retains old material.
- Keep `MEMORY.md` entrypoint ≤4,096 UTF-8 bytes, chunks ≤8,192 bytes; rotate before append exceeds 6,144 bytes and update links. Preserve history.
- Check the current file SHA, reconcile concurrent writes, confirm commit success. If access is unavailable, report that sync did not occur.

There is **no reliable session-close callback**, unattended auto-sync, or automatic update of a provider's built-in memory.

## Project code map
`src/simulation.js` global time/ecosystem; `src/surface-world.js` local agents; `src/renderer.js` globe; `src/surface-view.js` terrain/agents; `src/vegetation-view.js` trees; `src/creature-models.js` figures; `src/camera-controls.js` navigation; `src/app.js` UI; `tests/` verification.
