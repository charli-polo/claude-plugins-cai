---
description: Copy all runnable commands from the last Claude message to clipboard history (first cmd at top)
---

Run this and show the output:

```bash
node $(ls -d ~/.claude/plugins/cache/charli-plugins/clipboard-utils-cai/*/scripts/cc.js 2>/dev/null | sort -V | tail -1)
```
