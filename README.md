# charli-plugins

Marketplace personnelle de plugins pour Claude Code et Claude Desktop.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub (public)                          │
│              repo: charli-polo/claude-plugins-cai               │
│                     (ce repo — la marketplace)                  │
└───────────────────────┬─────────────────────────────────────────┘
                        │  sync auto (autoUpdate)
          ┌─────────────┴──────────────┐
          │                            │
          ▼                            ▼
┌─────────────────┐          ┌──────────────────────┐
│   Claude Code   │          │    Claude Desktop     │
│       CLI       │          │       (Cowork)        │
├─────────────────┤          ├──────────────────────┤
│ settings.json   │          │  installé via l'app   │
│                 │          │  (marketplace GitHub) │
│ extraKnown      │          └──────────────────────┘
│ Marketplaces:   │
│  charli-plugins │
│  (github repo)  │
│                 │
│ enabledPlugins: │
│  charli-mcp     │
│  sncf-calendar  │
│  ...            │
└─────────────────┘
```

### Chargement du MCP personnel

Le MCP tourne sur un **Cloudflare Worker** (repo séparé) et expose des outils custom (SNCF, etc.).
Il est chargé différemment selon le client :

```
┌──────────────────────────────────────────────────────────────────┐
│              MCP perso (Cloudflare Worker)                       │
│     https://mcp-personal-tools.capablanca.workers.dev/mcp        │
└──────────┬──────────────────────────────────┬────────────────────┘
           │                                  │
           ▼                                  ▼
┌──────────────────────┐          ┌───────────────────────────────┐
│     Claude Code      │          │        Claude Desktop          │
├──────────────────────┤          ├───────────────────────────────┤
│ Plugin charli-mcp    │          │ claude_desktop_config.json     │
│ (de la marketplace)  │          │ (config manuelle, token en     │
│                      │          │  clair dans le fichier)        │
│ → scripts/start.sh   │          │                                │
│   lit token depuis   │          │ ⚠️  Ne pas installer le plugin  │
│   ~/.claude/         │          │    charli-mcp dans Claude      │
│   plugin-env         │          │    Desktop — config directe    │
│                      │          │    uniquement                  │
└──────────────────────┘          └───────────────────────────────┘
```

> **Pourquoi deux méthodes ?**
> Le plugin utilise `${CLAUDE_PLUGIN_ROOT}` et lit `~/.claude/plugin-env` — des mécanismes que Claude Code gère mais pas Claude Desktop.
> Claude Desktop charge le MCP directement via `npx mcp-remote` avec token et PATH explicites dans sa config.

---

## Installation de la marketplace

**Claude Code :**
```bash
/plugin marketplace add charli-polo/claude-plugins-cai
```

Déclaration résultante dans `settings.json` :
```json
"enabledPlugins": { "charli-mcp@charli-plugins": true },
"extraKnownMarketplaces": {
  "charli-plugins": {
    "source": { "source": "github", "repo": "charli-polo/claude-plugins-cai" },
    "autoUpdate": true
  }
}
```

**Claude Desktop :** installé via l'interface de l'app (marketplace GitHub publique).

---

## Gestion des secrets

Les plugins Claude Code utilisent **`~/.claude/plugin-env`** (jamais versionné) :

```bash
# ~/.claude/plugin-env
export CHARLI_MCP_TOKEN=<ton_token>
```

Claude Desktop a son token directement dans `~/Library/Application Support/Claude/claude_desktop_config.json`.

---

## Plugins disponibles

### `charli-mcp`
Charge le MCP personnel (Cloudflare Worker) dans Claude Code.
- Prérequis : `CHARLI_MCP_TOKEN` dans `~/.claude/plugin-env`
- ⚠️ Claude Code uniquement — ne pas activer dans Claude Desktop

```
/plugin install charli-mcp@charli-plugins
```

---

### `assistant-personnel`
Synchronise les trajets SNCF avec Google Calendar.
- Crée des blocs porte-à-porte (vélo, train, métro) pour chaque trajet
- Détecte les conflits et envoie une alerte Slack
- Idempotent — ne crée jamais de doublons
- Commande : `/sncf-calendar-sync:sync-sncf`

```
/plugin install assistant-personnel@charli-plugins
```

---

### `manager-deepdive`
Deep dive analysis d'un projet pour managers techniques.
- Analyse architecture, logique métier, carte d'équipe, rythme de livraison
- Intègre Slack, Notion, et git pour une vue complète
- Sortie structurée dans Notion (Claude Document Hub)
- Contexte Brevo (organigramme, patterns Slack `tmp-*`, etc.)

```
/plugin install manager-deepdive@charli-plugins
```

---

## To do
- renommer les plugins pour que je vois facilement qu'ils viennent de ma marketplace
- indiquer à la skill sncf de ne pas regarder dans notion, seulement mon mcp et celui de l'agenda, et à la limite d'autres sources (gmail, slack) si besoin mais pas notion
- corriger la skill sncf pour noter les présences à paris
- mieux gérer les changements de train
- voir si je peux préréserver un pony
- bug slack (pas de lien)
