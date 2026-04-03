---
description: Copy all runnable commands from the last Claude message to clipboard history (first cmd at top)
---

Look at the **previous assistant message** in this conversation (the one just before this /c invocation).

Extract every shell command or code block the user would need to type or run. These are:
- Content inside triple-backtick code blocks (extract the inner text only, no fences)
- Lines prefixed with `$` or `>` (strip the prefix)
- Any text clearly meant to be executed in a terminal

Ignore prose explanations, output examples, and file contents that aren't commands.

Then use the Bash tool to copy them to the clipboard **in reverse order** (last command first, first command last), with a 400ms pause between each copy. This way a clipboard manager (Raycast, Maccy, etc.) will show the first command at the top of history, ready to paste first.

For each item (in reverse), run:
```
printf '%s' "THE COMMAND HERE" | pbcopy && sleep 0.4
```

Use `printf '%s'` (not `echo`) to avoid adding a trailing newline.

After copying, print a numbered list of the commands **in execution order** (1 = first to run, top of clipboard history).
If no commands were found, say so clearly.
