---
description: Copy all runnable commands from the last Claude message to clipboard history (first cmd at top)
---

Look at the **previous assistant message** in this conversation (the one just before this /cc invocation).

Extract every shell command or slash command the user would need to type or run:
- Content inside triple-backtick code blocks (inner text only, no fences)
- Lines prefixed with `$` or `>` (strip the prefix)
- Standalone slash commands like `/gsd:execute-phase 3.2` (lines starting with `/`)

**Skip:**
- Prose, output examples, file contents
- Any line containing ` → ` (advisory annotations like `/clear first → fresh context window`)
- Descriptive titles (e.g. "Execute Phase 3.2 — run the 1 plan")

Then build and run a **single Bash call** that copies all commands in reverse order (last first, so first ends up at top of clipboard history), with 300ms pauses:

```bash
printf '%s' 'LAST_CMD' | pbcopy; sleep 0.3; printf '%s' 'FIRST_CMD' | pbcopy
```

Chain as many as needed with `; sleep 0.3;` between each. One tool call total — never loop or make separate calls per command.

Use single quotes around each command value. If the command itself contains single quotes, escape them as `'\''`.

After the Bash call, print the commands in **execution order** (1 = first to run = top of clipboard history).
