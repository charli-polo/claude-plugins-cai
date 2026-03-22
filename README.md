# charli-plugins

Marketplace personnelle de plugins Claude Code de Charli.

## Installation

```
/plugin marketplace add charli-polo/claude-plugins-cai
```

## Gestion des secrets

Les plugins qui nécessitent des tokens utilisent un fichier local **`~/.claude/plugin-env`** — jamais versionné, valable dans Claude Code et Claude Desktop.

```bash
# ~/.claude/plugin-env
export CHARLI_MCP_TOKEN=<ton_token>
export AUTRE_TOKEN=<autre_token>
```

Sur une nouvelle machine, créer ce fichier suffit à tout configurer.

---

## Plugins disponibles

### `agenda`
Vision hebdomadaire de l'agenda Google Calendar.
- Affiche la semaine en cours (ou la suivante si week-end)
- Commande : `/agenda:semaine`

```
/plugin install agenda@charli-plugins
```

---

### `sncf-calendar-sync`
Synchronise les trajets SNCF avec Google Calendar.
- Crée des blocs porte-à-porte (vélo, train, métro) pour chaque trajet
- Détecte les conflits et envoie une alerte Slack
- Idempotent — ne crée jamais de doublons
- Commande : `/sncf-calendar-sync:sync-sncf`

```
/plugin install sncf-calendar-sync@charli-plugins
```

---

### `charli-mcp`
Serveur MCP personnel — expose des outils custom (SNCF, etc.).
- Prérequis : `CHARLI_MCP_TOKEN` dans `~/.claude/plugin-env`
- Dépendance de `sncf-calendar-sync`
- Fonctionne dans Claude Code et Claude Desktop via un wrapper script

```
/plugin install charli-mcp@charli-plugins
```

---

### `test-plugin`
Plugin de validation de la structure du marketplace.
- Commande : `/test-plugin:hello`

```
/plugin install test-plugin@charli-plugins
```


## To do
- renommer les plugins pour que je vois facilement qu'il viennent de ma market place
- indique à la skill sncf de ne pas regarder dans notion, seulement mon mcp et celui de l'agenda, et à la limite d'autres sources (gmail, slack) si besoin mais pas notion
- corriger la skill sncf pour noter les présences à paris
- mieux gérer les changements de train
- voir si je peux préréserver un pony
- bug slack (pas de lien)
