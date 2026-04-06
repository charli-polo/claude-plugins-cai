---
name: dify:add-model
description: "Add an LLM provider model to Dify via Chrome DevTools MCP or API. Supports OpenAI-compatible providers like Cerebras, Groq, Together.ai. Use when configuring a new model, adding an LLM provider, or setting up Cerebras/Groq/custom models. Activates on: dify add model, add llm, add provider, configure model, cerebras dify, groq dify, openai compatible."
---

# Add LLM Model to Dify

Add an OpenAI-compatible LLM provider to a Dify instance.

## Prerequisites

- The **OpenAI-API-compatible** plugin must be installed on the Dify instance
- If not installed, navigate to Settings > Model Provider > Install "OpenAI-API-compatible" by langgenius
- Plugin install may fail on older plugin-daemon versions — see `dify:manage` for the `--offline` workaround

## Step 0 — Load config

Source `.env` from the working directory. If it doesn't exist, run `dify:manage` first to create it.

```bash
set -a; source .env; set +a
```

## Method 1 — Via Chrome DevTools MCP (Preferred for UI interactions)

Use this when the API method fails (form validation issues) or when the user wants visual confirmation.

### Step 1 — Navigate to model provider settings

```
navigate_page → $DIFY_WEB_URL/apps?action=showSettings&tab=provider
```

### Step 2 — Open "Ajouter un modèle" form

Take a snapshot, find the "Ajouter un modèle" button on the OpenAI-API-compatible card, click it.

### Step 3 — Fill the form

Fill fields using `click` + `type_text`:
1. **Model Name** — exact model ID from the provider (e.g., `llama3.1-8b`, `gpt-oss-120b`)
2. **Model Type** — click dropdown, select "LLM"
3. **Model display name** — human-readable name (e.g., `Cerebras Llama 3.1 8B`)
4. **API Key** — the provider's API key
5. **API endpoint URL** — the provider's base URL (e.g., `https://api.cerebras.ai/v1`)

### Step 4 — Fix numeric fields

CRITICAL: The context size and max tokens fields default to `4096`. Typing appends instead of replacing. Use JavaScript to set values correctly:

```javascript
// evaluate_script with this function:
() => {
  const allInputs = document.querySelectorAll('input');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  // Context size input (find by placeholder 'Enter your Model context size')
  for (const inp of allInputs) {
    if (inp.placeholder === 'Enter your Model context size') {
      setter.call(inp, '<CONTEXT_SIZE>');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Max tokens input (second 4096 value)
    if (inp.value === '4096' && inp.placeholder !== 'Enter your Model context size') {
      setter.call(inp, '<MAX_TOKENS>');
      inp.dispatchEvent(new Event('input', { bubbles: true }));
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
  return 'done';
}
```

### Step 5 — Submit and verify

Click "Ajouter". Wait 10 seconds. Verify the model appears in the provider card.

## Method 2 — Via API

Note: API model creation returns `{"result": "success"}` but may NOT persist the model if the plugin daemon doesn't validate it. Always verify by listing models after.

```bash
# After authentication (see dify:manage)
curl -s "$API_URL/console/api/workspaces/current/model-providers/langgenius/openai_api_compatible/openai_api_compatible/models" \
  -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "<model_id>",
    "model_type": "llm",
    "credentials": {
      "api_key": "<api_key>",
      "endpoint_url": "<base_url>",
      "mode": "chat",
      "context_size": "<size>",
      "max_tokens_to_sample": "<max_tokens>",
      "model_display_name": "<display_name>"
    }
  }'
```

## Set as Default System Model

```bash
curl -s "$API_URL/console/api/workspaces/current/default-model" \
  -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model_settings": [{
      "model_type": "llm",
      "provider": "langgenius/openai_api_compatible/openai_api_compatible",
      "model": "<model_id>"
    }]
  }'
```

## Common OpenAI-Compatible Providers

| Provider | Base URL | Example Models | Context |
|----------|----------|----------------|---------|
| Cerebras | `https://api.cerebras.ai/v1` | `llama3.1-8b`, `gpt-oss-120b` | 131072 |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` | 131072 |
| Together | `https://api.together.xyz/v1` | `meta-llama/Llama-3-70b-chat-hf` | 8192 |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-3.5-sonnet` | 200000 |

## Known Issues

- **Cerebras `gpt-oss-120b`**: Reasoning model — streaming puts output in `delta.reasoning` instead of `delta.content`, causing empty responses. Use `llama3.1-8b` for standard streaming.
- **Model validation**: Dify validates credentials by calling the provider API. If the model name is wrong, save returns success but model doesn't appear. Always test the model ID with a direct `curl` to the provider first:

```bash
curl -s <BASE_URL>/models -H "Authorization: Bearer <API_KEY>"
```
