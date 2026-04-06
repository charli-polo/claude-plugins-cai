---
name: dify:manage
description: "Authenticate and manage a self-hosted Dify instance. Login, check health, list apps, reset passwords, and manage Railway services. Use when connecting to Dify, checking status, or performing admin tasks. Activates on: dify login, dify status, dify health, dify admin, manage dify, railway dify."
---

# Manage Dify Instance

Authenticate and perform admin operations on a self-hosted Dify instance.

## Instance Configuration (.env)

All Dify skills read connection details from a `.env` file in the current working directory.

### First-time setup

If `.env` does not exist in the working directory, **ask the user** for each value and create it:

```bash
# Check if .env exists
if [ ! -f .env ]; then
  echo "No .env found. I need your Dify instance details to create one."
fi
```

Ask the user for:
1. **DIFY_API_URL** — Dify API base URL (e.g., `https://dify-api.example.com`)
2. **DIFY_WEB_URL** — Dify Web UI URL (e.g., `https://dify.example.com`)
3. **DIFY_EMAIL** — Admin email
4. **DIFY_PASSWORD** — Admin password
5. **RAILWAY_PROJECT** — Railway project name (optional, only if hosted on Railway)

Then write the `.env` file:

```
DIFY_API_URL=https://dify-api.example.com
DIFY_WEB_URL=https://dify.example.com
DIFY_EMAIL=admin@example.com
DIFY_PASSWORD=your-password-here
RAILWAY_PROJECT=my-dify-project
```

IMPORTANT: Never commit `.env` files. If a `.gitignore` exists, ensure `.env` is listed.

### Loading config

At the start of every Dify skill operation, source the `.env`:

```bash
set -a; source .env; set +a
API_URL="$DIFY_API_URL"
WEB_URL="$DIFY_WEB_URL"
EMAIL="$DIFY_EMAIL"
PASSWORD="$DIFY_PASSWORD"
```

If `.env` is missing, stop and run the first-time setup above.

## Authentication

Dify uses HttpOnly cookies + CSRF tokens. All API calls require both.

### Login and get tokens

```bash
ENCODED_PASS=$(echo -n "$PASSWORD" | base64)
curl -s -D /tmp/dify_headers "$API_URL/console/api/login" \
  -X POST -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$ENCODED_PASS\"}"

ACCESS_TOKEN=$(grep -i 'set-cookie.*access_token=' /tmp/dify_headers | sed 's/.*access_token=//;s/;.*//')
CSRF_TOKEN=$(grep -i 'set-cookie.*csrf_token=' /tmp/dify_headers | sed 's/.*csrf_token=//;s/;.*//')
```

IMPORTANT: Dify base64-encodes passwords before sending (not real encryption — just obfuscation). Always `echo -n "$PASSWORD" | base64` before sending.

### Authenticated request pattern

```bash
curl -s "$API_URL/console/api/<endpoint>" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN"
```

## Health Check

```bash
curl -s -o /dev/null -w "%{http_code}" "$API_URL/console/api/setup"
# 200 = healthy
```

## List Apps

```bash
curl -s "$API_URL/console/api/apps?page=1&limit=50" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "X-CSRF-Token: $CSRF_TOKEN" \
  -b "csrf_token=$CSRF_TOKEN"
```

Response: `data[]` array with `id`, `name`, `mode` (chat, advanced-chat, workflow, agent-chat, completion).

## Password Reset (via Railway SSH)

If the user is locked out, reset password by SSH into the Api service:

```bash
railway link --project "$RAILWAY_PROJECT"
expect -c '
spawn railway ssh -s Api
expect "# "
send "cd /app/api && flask reset-password --email <EMAIL> --new-password <NEW_PASS> --password-confirm <NEW_PASS>\r"
expect -timeout 30 "# "
send "exit\r"
expect eof
'
```

## Railway Cookie Domain Issue

CRITICAL: `up.railway.app` is on the browser Public Suffix List. Cookies with `Domain=.up.railway.app` are silently rejected by browsers. Custom domains are required. Set `COOKIE_DOMAIN=.<yourdomain>` on the Api service and update all URL env vars on both Api and Web services.

## Railway Plugin Daemon

The plugin-daemon service manages Dify plugins. Key issues:
- **v0.5.4 bug**: `--offline` flag added to `uv sync`, blocking plugin installs. Fixed in v0.5.6+.
- If plugins fail to install with "network was disabled", upgrade the plugin-daemon image or use a wrapper script at `/usr/local/bin/uv` that strips `--offline`.
