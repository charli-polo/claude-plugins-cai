---
name: dify:edit
description: "Edit a Dify workflow — modify system prompts, change models, update node configurations, or restructure the graph. Use when modifying an existing Dify app's workflow. Activates on: dify edit, edit workflow, change prompt, modify dify app, update workflow, change model dify."
---

# Edit Dify Workflow

Modify an existing Dify app's workflow via the API.

## Critical Rule — Hash Required

IMPORTANT: The workflow draft API uses optimistic concurrency via a `hash` field. You MUST:
1. GET the fresh draft (includes `hash`)
2. Modify the graph/features in memory
3. POST back with the same `hash`

Without the `hash`, the API returns `success` but **silently discards your changes**.

## Procedure

### Step 0 — Load config

Source `.env` from the working directory. If it doesn't exist, run `dify:manage` first to create it.

```bash
set -a; source .env; set +a
```

### Step 1 — Authenticate

Follow `dify:manage` authentication.

### Step 2 — Get fresh draft with hash

```bash
curl -s "$API_URL/console/api/apps/<APP_ID>/workflows/draft" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN" > /tmp/dify_draft.json
```

### Step 3 — Modify with Python

```python
import json

with open('/tmp/dify_draft.json') as f:
    draft = json.load(f)

# ALWAYS preserve the hash
hash_value = draft['hash']

# --- Modify nodes ---
for node in draft['graph']['nodes']:
    nd = node['data']

    # Change LLM system prompt
    if nd.get('type') == 'llm':
        nd['prompt_template'] = [{
            'role': 'system',
            'text': '<NEW_PROMPT>',
            'id': nd['prompt_template'][0]['id']  # preserve existing ID
        }]

    # Change model
    if nd.get('type') == 'llm':
        nd['model'] = {
            'provider': 'langgenius/openai_api_compatible/openai_api_compatible',
            'name': '<model_id>',
            'mode': 'chat',
            'completion_params': {'temperature': 0.7}
        }

    # Change agent instruction
    if nd.get('type') == 'agent':
        nd['agent_parameters']['instruction']['value'] = '<NEW_INSTRUCTION>'

# Build payload WITH hash
payload = {
    'graph': draft['graph'],
    'features': draft.get('features', {}),
    'environment_variables': draft.get('environment_variables', []),
    'conversation_variables': draft.get('conversation_variables', []),
    'hash': hash_value
}

with open('/tmp/dify_payload.json', 'w') as f:
    json.dump(payload, f)
```

### Step 4 — Save draft

```bash
curl -s "$API_URL/console/api/apps/<APP_ID>/workflows/draft" \
  -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/dify_payload.json
```

Expected: `{"result": "success", "hash": "<new_hash>", ...}`

### Step 5 — Publish

```bash
curl -s "$API_URL/console/api/apps/<APP_ID>/workflows/publish" \
  -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Expected: `{"result": "success"}`

### Step 6 — Verify

Re-export the DSL and confirm changes are reflected.

## Common Edit Operations

### Change system prompt
Target: `node.data.prompt_template[0].text` where `node.data.type == 'llm'`

### Change model provider
Target: `node.data.model` where `node.data.type == 'llm'`

### Update opening statement
Target: `draft.features.opening_statement`

### Update suggested questions
Target: `draft.features.suggested_questions` (array of strings)

### Add a node
Append to `draft.graph.nodes[]` with proper structure and add edges to `draft.graph.edges[]`. Use position coordinates ~300px apart horizontally.

### Node ID format
Dify uses timestamp-based IDs (e.g., `1775498702968`) or descriptive IDs (`llm`, `answer`). For new nodes, generate a timestamp: `str(int(time.time() * 1000))`.

## Edge Structure

```yaml
id: "<source>-source-<target>-target"
source: "<source_node_id>"
sourceHandle: "source"
target: "<target_node_id>"
targetHandle: "target"
type: "custom"
data:
  sourceType: "<source_node_type>"   # start, llm, agent, etc.
  targetType: "<target_node_type>"
```
