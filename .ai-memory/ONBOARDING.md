# Onboarding another development AI

1. Obtain the user's authorization and identify the actual AI provider/account.
2. Give the client least-privilege GitHub access, without storing credentials.
3. Have it read `tihloh/earth-evo/.ai-memory/config.yaml`, instructions and rules, shared facts and its **own** memory. The private `tihloh/ai-memory` repository is used only with authorized access.
4. Each AI creates its **own** namespace on its first authorized write. Do not prepopulate or modify another agent's memory.
5. With user approval, place this compact bootstrap in the AI client's supported memory/custom instructions:

> In development project chats, read and checkpoint my private GitHub general memory `tihloh/ai-memory` and the active project's `.ai-memory/` when enabled by project config. Follow agent ownership, review and no-secrets rules. Write concise milestones only in your own namespace. Don't sync unrelated chats or claim background syncing.

GitHub files cannot silently configure another provider's native memory.
