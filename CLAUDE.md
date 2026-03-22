# Mon marketplace perso de plugins Claude Code

Ce repo est un **marketplace personnel** de plugins pour Claude Code et Claude Desktop.
Il contient des skills, commandes et agents réutilisables, versionnés sur GitHub (repo public) et installables en une commande.

> Pour l'architecture complète (marketplace, MCP Cloudflare Worker, différences Claude Code / Claude Desktop), voir **README.md**.

---

## Structure du repo

```
charli-plugins/
├── .claude-plugin/
│   └── marketplace.json        ← catalogue du marketplace (OBLIGATOIRE)
├── plugins/
│   ├── mon-premier-plugin/
│   │   ├── .claude-plugin/
│   │   │   └── plugin.json     ← manifest du plugin (optionnel mais conseillé)
│   │   ├── skills/
│   │   │   └── mon-skill/
│   │   │       └── SKILL.md    ← cœur du skill
│   │   ├── commands/           ← commandes slash simples (.md)
│   │   ├── agents/             ← sous-agents (.md avec frontmatter)
│   │   ├── hooks/
│   │   │   └── hooks.json      ← event hooks
│   │   └── .mcp.json           ← serveurs MCP éventuels
│   └── mon-deuxieme-plugin/
│       └── ...
└── CLAUDE.md                   ← ce fichier
```

> ⚠️ `commands/`, `skills/`, `agents/`, `hooks/` doivent être à la **racine du plugin**, PAS dans `.claude-plugin/`. Seul `plugin.json` va dans `.claude-plugin/`.

---

## Fichiers clés

### `.claude-plugin/marketplace.json` — le catalogue

```json
{
  "name": "charli-plugins",
  "owner": {
    "name": "Charli",
    "email": "charli.idrac@brevo.com"
  },
  "metadata": {
    "description": "Mes plugins perso pour Claude Code",
    "pluginRoot": "./plugins"
  },
  "plugins": [
    {
      "name": "mon-premier-plugin",
      "source": "./plugins/mon-premier-plugin",
      "description": "Ce que fait ce plugin",
      "version": "1.0.0"
    }
  ]
}
```

> Le champ `"name"` du marketplace est l'identifiant utilisé dans les commandes d'install.
> Noms réservés à ne pas utiliser : `anthropic-marketplace`, `claude-code-marketplace`, etc.

### `.claude-plugin/plugin.json` — le manifest d'un plugin

```json
{
  "name": "mon-premier-plugin",
  "version": "1.0.0",
  "description": "Description courte",
  "author": {
    "name": "Charli"
  },
  "repository": "https://github.com/ton-username/charli-plugins"
}
```

> Le `name` doit être en **kebab-case** (minuscules, tirets). Il est utilisé pour le namespace des skills : `/charli-plugins:mon-skill`.

### `skills/mon-skill/SKILL.md` — un skill

```markdown
---
description: Ce que fait ce skill et quand Claude doit l'invoquer
---

Instructions détaillées pour Claude.
Peut inclure des étapes, des exemples, des références à des scripts.
```

### `commands/ma-commande.md` — une commande slash simple

```markdown
---
description: Description courte pour l'UI
---

Prompt ou instructions que Claude exécute quand on tape /ma-commande.
```

---

## Commandes Claude Code essentielles

```bash
# Tester en local avant de pousser sur GitHub
/plugin marketplace add ./          # depuis la racine du repo cloné

# Installer depuis GitHub (une fois poussé)
/plugin marketplace add ton-username/charli-plugins

# Installer un plugin du marketplace
/plugin install mon-premier-plugin@charli-plugins

# Mettre à jour depuis GitHub
/plugin marketplace update charli-plugins

# Valider la structure (JSON, frontmatter, hooks)
/plugin validate .

# Lister les plugins installés
/plugin list

# Déboguer le chargement
claude --debug
```

---

## Versioning

- Bump le champ `version` dans **`plugin.json` ET `marketplace.json`** avant chaque push qui change un plugin.
- Si la version ne change pas, ni Claude Code ni Claude Desktop ne détectent la mise à jour (cache).
- Format : `MAJOR.MINOR.PATCH` (ex : `1.0.0` → `1.0.1` pour un fix, `1.1.0` pour un ajout, `2.0.0` pour un breaking change).

> Si la version est définie dans les deux fichiers, c'est `plugin.json` qui a la priorité.
> Les deux doivent être synchronisés pour que la mise à jour soit détectée par les deux clients.

⚠️ **Renommer un plugin casse l'autoUpdate** — les utilisateurs doivent désinstaller l'ancien nom et installer le nouveau manuellement.

---

## Chemins et variables d'environnement

Dans les hooks et configs MCP, utiliser ces variables (jamais de chemins absolus) :

| Variable | Usage |
|---|---|
| `${CLAUDE_PLUGIN_ROOT}` | Chemin d'installation du plugin (change à chaque update) |
| `${CLAUDE_PLUGIN_DATA}` | Données persistantes entre les updates (~/.claude/plugins/data/…) |

```json
{
  "command": "${CLAUDE_PLUGIN_ROOT}/scripts/mon-script.sh"
}
```

---

## Accès depuis Cowork (Claude Desktop)

Les plugins installés via Claude Code CLI sont stockés dans `~/.claude/plugins/` mais **ne sont pas partagés avec Claude Desktop**. Les deux systèmes sont indépendants :
- Claude Code lit ses plugins depuis `~/.claude/plugins/` (géré par `settings.json`)
- Claude Desktop a sa propre installation de marketplace (via l'app) et sa propre config MCP (`claude_desktop_config.json`)

---

## MCP personnel — règle importante

Ce repo contient le plugin `charli-mcp` qui charge un MCP hébergé sur un **Cloudflare Worker** (repo séparé).
**Ce plugin ne fonctionne que dans Claude Code CLI** — ne jamais l'activer dans Claude Desktop.
Claude Desktop charge ce même MCP directement via `claude_desktop_config.json` (sans passer par le plugin).

---

## Repo GitHub public — authentification auto-update

Ce repo est **public**. Pour que les mises à jour en arrière-plan fonctionnent (au démarrage de Claude Code) :

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
# À ajouter dans ~/.zshrc ou ~/.bashrc
```

---

## Checklist avant de pousser une nouvelle version

- [ ] `plugin.json` **ET** `marketplace.json` : version bumpée (les deux, pas juste un)
- [ ] `/plugin validate .` passe sans erreur
- [ ] Testé en local avec `/plugin marketplace add ./`
- [ ] Scripts shell : `chmod +x scripts/*.sh`
- [ ] Pas de chemins `../` ou absolus dans les configs
