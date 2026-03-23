---
name: cai-sncf-calendar-sync
description: Synchronise les trajets SNCF avec le calendrier principal de Charli (blocs porte-à-porte)
---

## Objectif

Synchroniser les trajets SNCF à venir avec le calendrier Google principal de Charli (`charli.idrac@brevo.com`) en créant des blocs de déplacement porte-à-porte.

---

## Étape 1 — Récupérer les trains à venir

Appeler `get_sncf_events(days_ahead=90)` via charli-mcp.
Ignorer tous les événements dont `start` est antérieur à l'heure actuelle.

---

## Étape 2 — Déterminer la direction de chaque trajet

Le champ `summary` a le format : `"Gare départ > Gare arrivée - CODE - Type"`

- Summary commence par `"Bordeaux"` → **ALLER** (Bordeaux → Paris)
- Summary commence par `"Paris"` → **RETOUR** (Paris → Bordeaux)

---

## Étape 3 — Calculer les 3 blocs par trajet

**ALLER (Bordeaux → Paris) :**
- Pré : `🚲 Vélo → Gare de Bordeaux` — de `train.start - 40min` à `train.start`
- Train : `🚄 Bordeaux > Paris (Aller)` — de `train.start` à `train.end`
- Post : `🚇 Gare Montparnasse → Bureau Brevo` — de `train.end` à `train.end + 35min`

**RETOUR (Paris → Bordeaux) :**
- Pré : `🚇 Bureau Brevo → Gare Montparnasse` — de `train.start - 45min` à `train.start`
- Train : `🚄 Paris > Bordeaux (Retour)` — de `train.start` à `train.end`
- Post : `🏠 Gare de Bordeaux → Domicile` — de `train.end` à `train.end + 25min`

---

## Étape 4 — Identifier les événements compagnons existants

Chaque événement compagnon créé par cette tâche porte un tag dans sa description :
```
[SNCF-SYNC:<UID>:<TYPE>]
```
Où `<UID>` = uid de l'événement SNCF, `<TYPE>` = `pre`, `train`, ou `post`.

Pour chaque trajet, appeler `gcal_list_events` sur la plage `[train.start - 2h, train.end + 2h]` dans le calendrier `charli.idrac@brevo.com`, puis filtrer les événements dont la description contient `[SNCF-SYNC:<UID>:`.

---

## Étape 5 — Créer, mettre à jour ou supprimer

- **Bloc absent** → créer avec `gcal_create_event` (calendar_id: `charli.idrac@brevo.com`, status: busy, reminders: [], description contenant le tag)
- **Bloc existant, horaires changés** → mettre à jour avec `gcal_update_event`
- **Bloc existant, horaires identiques** → ne rien faire
- **Train disparu du calendrier SNCF** → supprimer ses 3 blocs avec `gcal_delete_event`

Pour détecter les trains disparus : lister les événements `charli.idrac@brevo.com` sur 90 jours contenant `[SNCF-SYNC:`, extraire les UIDs, et supprimer ceux absents des trains SNCF actuels.

---

## Étape 6 — Détecter les conflits

Pour chaque trajet, lister les événements de `charli.idrac@brevo.com` sur la fenêtre `[pré.start, post.end]`.
Exclure les événements dont la description contient `[SNCF-SYNC:`.
Exclure également les événements dont `self.responseStatus` est `"tentative"` (réponse "maybe") — ces événements n'engagent pas et ne constituent pas un conflit.
Si des événements restants chevauchent l'un des 3 blocs :

1. Chercher l'utilisatrice Charli Idrac (charli.idrac@brevo.com) avec `slack_search_users`
2. Pour chaque événement en conflit, récupérer son `htmlLink` (fourni par `gcal_list_events`)
3. Envoyer un DM avec `slack_send_message` au format :

```
🚨 *Conflit de calendrier — Trajet SNCF*

🚄 Trajet : <summary du train>
📅 Fenêtre : <date> de <heure_pré> à <heure_post>

Conflits :
• *<htmlLink|Titre>* (<heure début> – <heure fin>) — chevauche <nom du bloc concerné> (<heure bloc>)

👉 Pense à vérifier ton agenda !
```

> **Note :** Les titres des événements en conflit sont des liens Slack cliquables vers Google Calendar (format `<htmlLink|Titre>`).

---

## Règles importantes

- Ne jamais traiter les trains passés
- Le tag `[SNCF-SYNC:UID:TYPE]` garantit l'idempotence — ne jamais créer de doublons
- Calendrier cible : `charli.idrac@brevo.com` (calendrier principal, pas besoin de gcal_list_calendars)
- Ne jamais utiliser les outils Notion — sources autorisées : charli-mcp, Google Calendar, Slack uniquement
