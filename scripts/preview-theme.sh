#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env
ensure_node20

SHOPIFY_BIN="$(shopify_cli_bin)"

if [[ -z "$SHOPIFY_BIN" ]]; then
  echo "Shopify CLI is required for theme preview. Install dependencies first so the local CLI binary is available, then authenticate with your store." >&2
  exit 1
fi

ROOT="$(repo_root)"
THEME_PATH="${SHOPIFY_THEME_PATH:-theme}"
THEME_ROOT="$ROOT/$THEME_PATH"
THEME_STORE="${SHOPIFY_THEME_STORE:-${SHOPIFY_STORE_DOMAIN:-}}"

require_env THEME_STORE "Set SHOPIFY_THEME_STORE in .env so the theme preview knows which store to target."

if [[ ! -d "$THEME_ROOT" ]]; then
  echo "Theme path '$THEME_ROOT' does not exist." >&2
  exit 1
fi

print_step "Starting Shopify theme preview"
"$SHOPIFY_BIN" theme dev --store "$THEME_STORE" --path "$THEME_ROOT"