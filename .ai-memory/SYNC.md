# Development-thread memory synchronization

Active only for software development on accepted `main` with [config.yaml](config.yaml) declaring `memory_sync.enabled: true`.

1. **Identify:** actual agent, project, accepted branch and authorized GitHub access.
2. **Load:** read relevant private general memory if authorized; read this project's instructions, shared context, own agent index and selective chunks.
3. **Work:** inspect current code/tests instead of trusting potentially stale memory.
4. **Checkpoint:** on meaningful completed tasks or explicit "sync memory", record a concise dated note with links and status **to your own agent namespace**.
5. **Validate:** exclude secrets, keep size/index rules, re-fetch SHA, reconcile concurrent edits.
6. **Commit and verify:** report actual success, or report inability to update.
7. **General repo:** save only truly cross-project knowledge in your own private general namespace; do not duplicate project notes.

No background syncing, guaranteed session-end event, or automatic native AI-memory changes.
