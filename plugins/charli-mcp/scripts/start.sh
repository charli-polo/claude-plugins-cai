#!/bin/bash
# Charge les secrets locaux s'ils existent
if [ -f "$HOME/.claude/plugin-env" ]; then
  source "$HOME/.claude/plugin-env"
fi

exec /opt/homebrew/opt/node@24/bin/npx mcp-remote \
  "https://mcp-personal-tools.capablanca.workers.dev/mcp" \
  --header "Authorization: Bearer $CHARLI_MCP_TOKEN"
