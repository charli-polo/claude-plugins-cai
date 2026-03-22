#!/bin/bash
# Charge les secrets locaux si le token n'est pas déjà fourni (ex: Claude Desktop via env)
if [ -z "$CHARLI_MCP_TOKEN" ]; then
  PLUGIN_ENV="${HOME}/.claude/plugin-env"
  if [ -f "$PLUGIN_ENV" ]; then
    source "$PLUGIN_ENV"
  fi
fi

# Assure que node est accessible (nécessaire quand lancé depuis Claude Desktop)
export PATH="/opt/homebrew/opt/node@24/bin:/opt/homebrew/bin:$PATH"

exec npx mcp-remote \
  "https://mcp-personal-tools.capablanca.workers.dev/mcp" \
  --header "Authorization: Bearer $CHARLI_MCP_TOKEN"
