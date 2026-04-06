---
name: dify:export
description: "Export a Dify app as a DSL YAML file. Lists apps and exports the selected one. Use when backing up, migrating, or inspecting a Dify workflow. Activates on: dify export, export dsl, export workflow, backup dify app, dify dsl."
---

# Export Dify DSL

Export a Dify application as a YAML DSL file.

## Procedure

### Step 0 — Load config

Source `.env` from the working directory. If it doesn't exist, run `dify:manage` first to create it.

```bash
set -a; source .env; set +a
```

### Step 1 — Authenticate

Follow `dify:manage` authentication to get `ACCESS_TOKEN` and `CSRF_TOKEN`.

### Step 2 — List apps (if app ID unknown)

```bash
curl -s "$API_URL/console/api/apps?page=1&limit=50" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for app in data.get('data', []):
    print(f\"{app['id']} - {app['name']} ({app['mode']})\")
"
```

Present the list to the user and ask which app to export.

### Step 3 — Export

```bash
curl -s "$API_URL/console/api/apps/<APP_ID>/export" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN"
```

Response: `{"data": "<yaml_string>"}` — the `data` field contains the full DSL as a YAML string.

### Step 4 — Save to file

```python
import json
response = ...  # the curl response
data = json.loads(response)
with open('<output_path>.dsl.yaml', 'w') as f:
    f.write(data['data'])
```

Default output path: `./<app_name>.dsl.yaml` in the current working directory.

## DSL Structure Reference

A valid Dify DSL has this top-level structure:

```yaml
app:
  name: string
  description: string
  icon: string
  icon_background: string
  icon_type: emoji
  mode: advanced-chat | chat | workflow | completion | agent-chat
  use_icon_as_answer_icon: false
dependencies: []          # Plugin dependencies
kind: app
version: "0.6.0"         # DSL format version
workflow:
  conversation_variables: []
  environment_variables: []
  features: {}            # Opening statement, file upload, speech, suggestions
  graph:
    edges: []             # Connections between nodes
    nodes: []             # Workflow nodes (start, llm, answer, agent, etc.)
    viewport: {x, y, zoom}
  rag_pipeline_variables: []
```

### Variable Reference Syntax

Dify variables use the pattern: `{{#node_id.field_name#}}`

- System: `{{#sys.query#}}`, `{{#sys.files#}}`, `{{#sys.user_id#}}`
- Node output: `{{#<node_id>.text#}}`, `{{#<node_id>.result#}}`
- Environment: `{{#env.VARIABLE_NAME#}}`
