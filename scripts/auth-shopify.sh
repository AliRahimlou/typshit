#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env
ensure_node20

THEME_STORE="${SHOPIFY_THEME_STORE:-${SHOPIFY_STORE_DOMAIN:-}}"
require_env THEME_STORE "Set SHOPIFY_THEME_STORE in .env so Shopify CLI knows which store to authenticate against."

SHOPIFY_BIN="$(shopify_cli_bin)"

if [[ -z "$SHOPIFY_BIN" ]]; then
  echo "Shopify CLI is required. Install dependencies first so the local CLI binary is available." >&2
  exit 1
fi

print_step "Authenticating Shopify CLI"
"$SHOPIFY_BIN" auth login --store "$THEME_STORE"