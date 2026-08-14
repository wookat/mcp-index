#!/usr/bin/env bash
# Idempotently attach the mcp-index Workers custom domain (zone-level route).
# Usage: CLOUDFLARE_GLOBAL_API_TOKEN=... ./scripts/cf-ensure-route.sh
set -euo pipefail

: "${CLOUDFLARE_GLOBAL_API_TOKEN:?set CLOUDFLARE_GLOBAL_API_TOKEN}"
ACCOUNT_ID="ddff52d24ee44e21a021c15eaffcc86d"
ZONE_ID="0472c8fde06e7c8cf832bd2a452eb2ef" # zalize.com

curl -sS -X PUT \
  -H "Authorization: Bearer ${CLOUDFLARE_GLOBAL_API_TOKEN}" \
  -H "Content-Type: application/json" \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/workers/domains" \
  -d "{\"zone_id\":\"${ZONE_ID}\",\"hostname\":\"mcp.zalize.com\",\"service\":\"mcp-index\",\"environment\":\"production\"}" \
  | python3 -c 'import json,sys; r=json.load(sys.stdin); print("ok" if r["success"] else r["errors"]); sys.exit(0 if r["success"] else 1)'

echo "live: https://mcp.zalize.com/ -> $(curl -s -o /dev/null -w '%{http_code}' https://mcp.zalize.com/)"
