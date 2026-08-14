#!/usr/bin/env bash
# Idempotently ensure the zone-level Rate Limiting rule protecting the
# mcp.zalize.com write/expensive endpoints (/api/track, /api/stats, /search),
# replacing the per-colo Workers ratelimit binding approximation.
#
# Free plan: 1 rate limiting rule per zone, counting period fixed at 10s.
# This rule is scoped to host mcp.zalize.com only, so it uses the zone's
# single free rule; keep other hosts' protection at the Worker level.
#
# Requires a token with Zone -> WAF (Zone Rulesets) : Edit on zalize.com.
#
# Usage: CLOUDFLARE_GLOBAL_API_TOKEN=... ./scripts/cf-zone-ratelimit.sh
set -euo pipefail

: "${CLOUDFLARE_GLOBAL_API_TOKEN:?set CLOUDFLARE_GLOBAL_API_TOKEN}"
ZONE_ID="0472c8fde06e7c8cf832bd2a452eb2ef" # zalize.com
API="https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/rulesets"
AUTH=(-H "Authorization: Bearer ${CLOUDFLARE_GLOBAL_API_TOKEN}" -H "Content-Type: application/json")
RULE_DESC="mcp-index hot endpoints rate limit"

EXPR='(http.host eq "mcp.zalize.com" and (http.request.uri.path eq "/api/track" or http.request.uri.path eq "/api/stats" or starts_with(http.request.uri.path, "/search")))'

PAYLOAD=$(python3 - "$RULE_DESC" "$EXPR" <<'PY'
import json, sys
desc, expr = sys.argv[1], sys.argv[2]
print(json.dumps({
    "description": desc,
    "expression": expr,
    "action": "block",
    "ratelimit": {
        "characteristics": ["ip.src", "cf.colo.id"],
        "period": 10,
        "requests_per_period": 20,
        "mitigation_timeout": 10,
    },
    "enabled": True,
}))
PY
)

ENTRY=$(curl -sS "${AUTH[@]}" "${API}/phases/http_ratelimit/entrypoint")
OK=$(printf '%s' "$ENTRY" | python3 -c 'import json,sys; print(json.load(sys.stdin)["success"])')
if [ "$OK" != "True" ]; then
  echo "ERROR: cannot read http_ratelimit entrypoint (token lacks Zone WAF permission?):"
  printf '%s\n' "$ENTRY"
  exit 1
fi

RULESET_ID=$(printf '%s' "$ENTRY" | python3 -c 'import json,sys; print(json.load(sys.stdin)["result"]["id"])')
RULE_ID=$(printf '%s' "$ENTRY" | python3 -c "
import json,sys
rs=json.load(sys.stdin)['result']
print(next((r['id'] for r in rs.get('rules',[]) if r.get('description')=='${RULE_DESC}'),''))")

if [ -n "$RULE_ID" ]; then
  echo "== updating rule ${RULE_ID} in ruleset ${RULESET_ID}"
  curl -sS -X PATCH "${AUTH[@]}" "${API}/${RULESET_ID}/rules/${RULE_ID}" -d "$PAYLOAD" \
    | python3 -c 'import json,sys; r=json.load(sys.stdin); print("   ok" if r["success"] else r["errors"]); sys.exit(0 if r["success"] else 1)'
else
  echo "== adding rule to ruleset ${RULESET_ID}"
  curl -sS -X POST "${AUTH[@]}" "${API}/${RULESET_ID}/rules" -d "$PAYLOAD" \
    | python3 -c 'import json,sys; r=json.load(sys.stdin); print("   ok" if r["success"] else r["errors"]); sys.exit(0 if r["success"] else 1)'
fi

echo "== smoke test: 25 rapid GET /api/stats (expect some 429 after ~20)"
for i in $(seq 1 25); do curl -s -o /dev/null -w '%{http_code} ' https://mcp.zalize.com/api/stats; done; echo
