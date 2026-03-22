---
description: Affiche une vision hebdomadaire de l'agenda Google Calendar. Si on est samedi ou dimanche, affiche la semaine suivante. Sinon affiche la semaine en cours (lundi au vendredi).
---

## Objectif
Donner une vue claire et structurée des événements de la semaine.

## Étapes

### 1. Déterminer la semaine à afficher
- Récupère la date d'aujourd'hui
- Si aujourd'hui est **samedi ou dimanche** → affiche la **semaine suivante** (lundi au vendredi)
- Sinon → affiche la **semaine en cours** (lundi au vendredi)
- Calcule les dates ISO du lundi et vendredi de la semaine cible

### 2. Lister les calendriers disponibles
- Appelle `gcal_list_calendars` pour récupérer les IDs des calendriers actifs

### 3. Récupérer les événements
- Appelle `gcal_list_events` avec :
  - `timeMin` = lundi de la semaine cible (début de journée, ex: `2026-03-23T00:00:00`)
  - `timeMax` = vendredi de la semaine cible (fin de journée, ex: `2026-03-27T23:59:59`)
  - `maxResults` = 50
- Si plusieurs calendriers, fais un appel par calendrier pertinent

### 4. Formater l'affichage

Affiche le résultat sous cette forme :

```
📅 Semaine du [date lundi] au [date vendredi]

Lundi [date]
  09:00 – 10:00  Titre de l'événement  [📍 lieu si dispo]
  14:00 – 15:30  Autre événement

Mardi [date]
  (rien de prévu)

Mercredi [date]
  ...
```

**Règles de formatage :**
- Affiche chaque jour même s'il est vide (indique "rien de prévu")
- Trie les événements par heure de début
- Pour les événements toute la journée, indique `[toute la journée]`
- Indique le lieu s'il est renseigné
- Si un événement dure plusieurs jours, affiche-le sur chaque jour concerné
- Termine par un résumé : nombre total d'événements, heures de réunion cumulées
