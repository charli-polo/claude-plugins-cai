---
name: dify:import
description: "Import a DSL YAML file into Dify as a new app. Use when deploying a workflow, restoring a backup, or migrating between instances. Activates on: dify import, import dsl, import workflow, deploy dify app, load dsl."
---

# Import Dify DSL

Import a YAML DSL file into Dify to create a new application.

## Procedure

### Step 0 — Load config

Source `.env` from the working directory. If it doesn't exist, run `dify:manage` first to create it.

```bash
set -a; source .env; set +a
```

### Step 1 — Authenticate

Follow `dify:manage` authentication to get `ACCESS_TOKEN` and `CSRF_TOKEN`.

### Step 2 — Read the DSL file

Ask the user for the file path. Read and validate it's valid YAML with the expected `app:`, `kind:`, `workflow:` top-level keys.

### Step 3 — Import

```bash
curl -s "$API_URL/console/api/apps/imports" \
  -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "
import json
with open('<DSL_FILE_PATH>', 'r') as f:
    dsl = f.read()
print(json.dumps({'yaml_content': dsl, 'mode': 'yaml-content'}))
")"
```

IMPORTANT: The import mode MUST be `yaml-content` with the DSL in the `yaml_content` field. Other modes (`yaml-dsl`, `dsl`, `yaml`) will fail.

### Step 4 — Verify

Successful response:

```json
{
  "id": "<import_task_id>",
  "status": "completed",
  "app_id": "<new_app_id>",
  "app_mode": "advanced-chat",
  "current_dsl_version": "0.6.0",
  "imported_dsl_version": "0.6.0",
  "error": ""
}
```

Check `status == "completed"` and `error == ""`. Report the `app_id` and `app_mode` to the user.

If `status == "failed"`, show the `error` field. Common errors:
- Missing plugin dependencies — the DSL references plugins not installed on the target instance
- Version mismatch — DSL version newer than the Dify instance supports

### Dependency Handling

If the DSL has `dependencies:` entries, the target Dify instance must have those plugins installed. Check the `dependencies` section before importing and warn the user about any required plugins.
