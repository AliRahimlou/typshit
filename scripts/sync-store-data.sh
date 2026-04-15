#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env
trap cleanup_agent_server EXIT
start_agent_server_if_needed

BASE_URL="$(agent_base_url)"
CATALOG_KEY="${CATALOG_KEY:-typsh-it-launch}"
STORE_PUBLISH="${STORE_PUBLISH:-true}"

print_step "Syncing Shopify metaobject definitions"
curl -fsS -X POST "$BASE_URL/workflows/create-theme-metaobject-definitions"

if [[ "${STORE_SYNC_ZENDROP_ASSETS:-0}" == "1" ]]; then
  print_step "Refreshing linked Zendrop product assets"
  curl -fsS \
    -X POST \
    -H 'Content-Type: application/json' \
    --data "{\"catalogKey\":\"$CATALOG_KEY\",\"publish\":$STORE_PUBLISH,\"maxImages\":6}" \
    "$BASE_URL/workflows/zendrop-sync-linked-product-assets"
fi

print_step "Syncing launch storefront data"
curl -fsS \
  -X POST \
  -H 'Content-Type: application/json' \
  --data "{\"catalogKey\":\"$CATALOG_KEY\",\"publish\":$STORE_PUBLISH}" \
  "$BASE_URL/workflows/sync-launch-storefront"

print_step "Checking launch readiness"
curl -fsS "$BASE_URL/workflows/launch-readiness"