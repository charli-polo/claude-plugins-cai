# charli-plugins

Marketplace personnelle de plugins Claude Code de Charli.

## Installation

```
/plugin marketplace add charli-polo/claude-plugins-cai
```

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

### `test-plugin`
Plugin de validation de la structure du marketplace.
- Commande : `/test-plugin:hello`

```
/plugin install test-plugin@charli-plugins
```
