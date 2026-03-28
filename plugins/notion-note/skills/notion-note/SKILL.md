---
description: Envoie une note ou un document dans le Claude Document Hub Notion de Brevo (database notion-note-cai). Invoquer quand l'utilisateur veut sauvegarder une note, un retex, un document dans Notion.
---

# notion-note

Crée une page dans le **Claude Document Hub** Notion de Brevo.

**Database :** `Claude Document Hub`
**Data source ID :** `32444900-2dcb-8088-ab87-000b3bbaa590`
**Catégories disponibles :** `Proposal`, `Customer research`, `Strategy doc`, `Planning`

## Comportement

1. **Si l'utilisateur passe un nom de fichier en argument** (ex. `/notion-note RETEX.md`) :
   - Lis le fichier avec le tool `Read` depuis le dossier courant
   - Propose un titre basé sur le nom du fichier ou le premier heading `#`
   - Propose une catégorie en fonction du contenu
   - Demande confirmation avant de créer

2. **Si l'utilisateur passe un titre et une catégorie** (ex. `/notion-note Mon analyse | Strategy doc`) :
   - Utilise ces valeurs directement
   - Demande le contenu

3. **Sans argument** :
   - Demande le titre, la catégorie (optionnelle), et le contenu

4. **Création de la page** via `mcp__claude_ai_Notion__notion-create-pages` :
   - `parent.type` = `data_source_id`
   - `parent.data_source_id` = `32444900-2dcb-8088-ab87-000b3bbaa590`
   - `properties["Doc name"]` = titre
   - `properties["Category"]` = catégorie en JSON array ex. `["Strategy doc"]` (omettre si aucune)
   - `content` = contenu en Notion markdown

5. **Retourner l'URL** de la page créée.

## Notes

- Le contenu peut être du markdown standard — les blocs de code, tableaux et headers sont supportés par Notion
- Ne pas inclure le titre dans le `content`, il est géré par la property `Doc name`
- `NEXT_PUBLIC_BASE_PATH` et autres variables techniques ne sont pas pertinentes ici
