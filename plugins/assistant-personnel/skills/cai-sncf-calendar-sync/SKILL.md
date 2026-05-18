---
name: cai-sncf-calendar-sync
description: Synchronise les trajets SNCF avec le calendrier principal de Charli (blocs porte-à-porte)
---

## Objectif

Synchroniser les trajets SNCF à venir avec le calendrier Google principal de Charli (`charli.idrac@brevo.com`) en créant des blocs de déplacement porte-à-porte, détecter les conflits, marquer les Working Locations, et mettre à jour le calendrier familial Google Sheets.

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

- **Bloc absent** → créer avec `gcal_create_event` (calendar_id: `charli.idrac@brevo.com`, status: busy, description contenant le tag)
  - Blocs `pre` et `train` : reminders par défaut (ne pas surcharger)
  - Bloc `post` : `reminders: []` — inutile d'être rappelé à l'arrivée du train
- **Bloc existant, horaires changés** → mettre à jour avec `gcal_update_event`
- **Bloc existant, horaires identiques** → ne rien faire
- **Train disparu du calendrier SNCF** → supprimer ses 3 blocs avec `gcal_delete_event`

Pour détecter les trains disparus : lister les événements `charli.idrac@brevo.com` sur 90 jours contenant `[SNCF-SYNC:`, extraire les UIDs, et supprimer ceux absents des trains SNCF actuels.

> **Important — ne jamais corriger le passé :** Si des blocs compagnons sont désynchronisés (horaires décalés, blocs orphelins, etc.), ignorer ceux dont la date est antérieure à l'heure actuelle. Seuls les événements futurs doivent être créés, mis à jour ou supprimés. Inutile de nettoyer l'historique.

---

## Étape 6 — Détecter les conflits

Pour chaque trajet, lister les événements de `charli.idrac@brevo.com` sur la fenêtre `[pré.start, post.end]`.

Exclure les événements dont :
- la description contient `[SNCF-SYNC:]`
- `self.responseStatus` est `"tentative"` (réponse "maybe") — l'engagement n'est pas ferme
- `transparency` est `"transparent"` — événements informatifs sans blocage réel (jours fériés, placeholders all-day, etc.)

Collecter tous les conflits de **tous les trajets**, puis envoyer **un seul DM consolidé** à Charli.

**ID Slack de Charli : `U09TVCP3ZM3`** — utiliser directement, pas besoin de `slack_search_users`.

Pour chaque événement en conflit, récupérer son `htmlLink` (fourni par `gcal_list_events`).

Envoyer avec `slack_send_message` au format :

```
🚨 *Conflits de calendrier — Trajets SNCF (mise à jour)*

---

🚄 Trajet : <TGV N° XXXX — ex. Bordeaux > Paris>
📅 Fenêtre : <date> de <heure_pré> à <heure_post>

Conflits :
• *<htmlLink|Titre>* (<heure début> – <heure fin>) — chevauche <nom du bloc concerné> (<heure bloc>)

---

🚄 Trajet : ...

---

👉 Pense à vérifier ton agenda !
```

> **Note :** Les titres sont des liens Slack cliquables vers Google Calendar (format `<htmlLink|Titre>`). Grouper tous les conflits en un seul DM, séparés par `---` par trajet.

---

## Étape 7 — Marquer les présences (Paris / Bordeaux)

Chaque jour ouvré (lundi–vendredi) doit avoir un événement Working Location : Paris ou Bordeaux.

**Construction de l'état courant :**
Trier tous les trains à venir par date, puis déterminer l'état initial avant le premier train :
- Si le premier train est un **RETOUR** → état initial = **Paris** (il était déjà à Paris)
- Si le premier train est un **ALLER** → état initial = **Bordeaux**

Parcourir les trains dans l'ordre pour calculer les plages de présence :
- **Jour d'un ALLER** : ce jour = Paris ; état passe à Paris
- **Jour d'un RETOUR** :
  - `train.start ≥ 12:00` → ce jour = Paris (plus d'une demi-journée sur place) ; état passe à Bordeaux le lendemain
  - `train.start < 12:00` → ce jour = Bordeaux ; état passe à Bordeaux ce jour
- **Autres jours** : = état courant (Paris ou Bordeaux)

**Créer ou mettre à jour les événements :**

Pour chaque jour ouvré (lundi–vendredi) dans les 90 prochains jours :

1. Appeler `gcal_list_events` sur la journée (calendrier `charli.idrac@brevo.com`)
2. Chercher un événement `workingLocation` (all-day) dont le titre est `"Paris Salneuve (Office)"` (Paris) ou `"Working from home (Bordeaux)"` (Bordeaux)
3. **Bon lieu déjà présent** → ne rien faire
4. **Mauvais lieu présent** → supprimer avec `gcal_delete_event`, puis appeler `set_working_location`
5. **Aucun événement Working Location** → appeler `set_working_location`

```
set_working_location(
  calendar_id = "charli.idrac@brevo.com",
  date        = "YYYY-MM-DD",
  location    = "paris" | "bordeaux",
  label       = "Paris Salneuve (Office)" | "Working from home (Bordeaux)"
)
```

> **Pourquoi `set_working_location` et pas `gcal_create_event` :** le MCP Google Calendar standard ignore silencieusement `eventType: "workingLocation"` — les événements sont créés en type `default` et n'apparaissent pas comme badge Working Location dans l'UI. `set_working_location` appelle l'API Google Calendar v3 directement depuis le Worker avec le bon payload.

> **Si `set_working_location` échoue avec `invalid_grant` :** le token charli-mcp est expiré. Arrêter cette étape et demander à Charli de re-autoriser charli-mcp dans Cowork **Settings → Connections**, puis relancer la synchro.

---

## Étape 8 — Mettre à jour le calendrier familial Google Sheets

Mettre à jour la colonne **C ("Appart")** de la feuille **"2026"** du spreadsheet famille pour indiquer les nuits où Charli dort à l'appartement parisien.

**Spreadsheet :** `1swL7BJaXYIJ-KZRp53ehEJUPEh-vltTyPEUrtadV36U`
**Project Apps Script :** `1D6NFlU-D8RROz6oqIgOWJnLykhWnJz-xfGk0ZPaNzyJmOEcWEVovBGIp`

### Règle "nuit à Paris"

N'ajouter le nom de Charli que s'il **dort** à Paris ce soir-là (encore à Paris le lendemain matin) :

| Situation | Dors à Paris ? |
|---|---|
| Jour d'un ALLER (arrive à Paris) | ✅ oui |
| Lendemain d'un ALLER, sans RETOUR ce jour | ✅ oui |
| Jour d'un RETOUR (part de Paris) | ❌ non |
| Aller-retour le même jour (day trip) | ❌ non |

### Format de mise à jour des cellules

- Cellule déjà remplie → ajouter ` +Charli` à la fin (ex. `"Parents Nuit"` → `"Parents Nuit +Charli"`)
- Cellule vide → écrire `"Charli"`

Lire la valeur actuelle de la colonne C via le Google Drive MCP (`read_file_content` avec l'ID du spreadsheet) avant de construire les valeurs finales.

### Génération du script Apps Script

Générer un script Apps Script avec les dates et valeurs hardcodées calculées, puis demander à Charli de le coller dans l'éditeur et de cliquer sur ▶ Exécuter.

```javascript
function updateCharliPresence() {
  var ss = SpreadsheetApp.openById('1swL7BJaXYIJ-KZRp53ehEJUPEh-vltTyPEUrtadV36U');
  var sheet = ss.getSheetByName('2026');
  var tz = ss.getSpreadsheetTimeZone();
  var updates = {
    // '<DD/MM/YYYY>': '<valeur calculée>',
  };
  var data = sheet.getDataRange().getValues();
  var updated = 0;
  for (var i = 0; i < data.length; i++) {
    var cellB = data[i][1];
    var dateStr;
    // ⚠️ Bug Apps Script V8 : instanceof Date retourne false pour les objets Date
    // issus de getValues() — utiliser le duck typing à la place
    if (typeof cellB === 'object' && cellB !== null && typeof cellB.getFullYear === 'function') {
      dateStr = Utilities.formatDate(cellB, tz, 'dd/MM/yyyy');
    } else {
      dateStr = String(cellB).trim();
    }
    if (updates[dateStr] !== undefined) {
      sheet.getRange(i + 1, 3).setValue(updates[dateStr]);
      updated++;
    }
  }
  Logger.log('Updated ' + updated + ' cells');
}
```

> **Bug critique Apps Script V8 :** `instanceof Date` retourne `false` pour les objets Date issus de `getValues()`, même si `typeof` retourne `"object"`. Toujours utiliser le duck typing (`typeof cellB.getFullYear === 'function'`) et `Utilities.formatDate(cellB, tz, 'dd/MM/yyyy')` pour le formatage — ne jamais utiliser `getDate().padStart()` manuellement.

### Si les outils Chrome sont bloqués

Si `computer` ou `javascript_tool` échoue avec `"Cannot access a chrome-extension:// URL of different extension"`, c'est un conflit d'extension Chrome — ces outils ne fonctionneront pas. Dans ce cas, fournir le script à Charli avec les instructions :
1. Ouvrir [l'éditeur Apps Script](https://script.google.com/u/1/home/projects/1D6NFlU-D8RROz6oqIgOWJnLykhWnJz-xfGk0ZPaNzyJmOEcWEVovBGIp/edit)
2. Sélectionner tout (Ctrl+A), coller le script
3. Cliquer sur ▶ Exécuter — le log doit afficher `Updated N cells`

---

## Règles importantes

- Ne jamais traiter les trains passés
- **Ne jamais corriger le passé :** si des blocs compagnons ou des Working Locations sont désynchronisés pour des dates passées, les ignorer. Seul le futur est à maintenir à jour.
- Calendrier cible : `charli.idrac@brevo.com` (calendrier principal, pas besoin de `gcal_list_calendars`)
- **Charli est un homme** — utiliser le masculin dans tous les messages et commentaires
- **ID Slack de Charli** : `U09TVCP3ZM3` — pas besoin de `slack_search_users`
- Ne jamais utiliser les outils Notion — sources autorisées : charli-mcp, Google Calendar, Slack, Google Drive uniquement
