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
THEME_DEV_HOST="${SHOPIFY_THEME_DEV_HOST:-127.0.0.1}"
REQUESTED_THEME_DEV_PORT="${SHOPIFY_THEME_DEV_PORT:-9292}"
THEME_DEV_PORT="$REQUESTED_THEME_DEV_PORT"

require_env THEME_STORE "Set SHOPIFY_THEME_STORE in .env so the theme preview knows which store to target."

if [[ ! -d "$THEME_ROOT" ]]; then
  echo "Theme path '$THEME_ROOT' does not exist." >&2
  exit 1
fi

if port_is_open "$THEME_DEV_HOST" "$THEME_DEV_PORT"; then
  THEME_DEV_PORT="$(find_available_port "$THEME_DEV_HOST" "$((REQUESTED_THEME_DEV_PORT + 1))")"
  print_step "Storefront preview port $REQUESTED_THEME_DEV_PORT is busy; using $THEME_DEV_PORT instead"
fi

COMMAND=(
  "$SHOPIFY_BIN"
  theme dev
  --store "$THEME_STORE"
  --path "$THEME_ROOT"
  --host "$THEME_DEV_HOST"
  --port "$THEME_DEV_PORT"
)

if [[ -n "${SHOPIFY_CLI_THEME_TOKEN:-}" ]]; then
  COMMAND+=(--password "$SHOPIFY_CLI_THEME_TOKEN")
fi

if [[ -n "${SHOPIFY_THEME_STORE_PASSWORD:-}" ]]; then
  COMMAND+=(--store-password "$SHOPIFY_THEME_STORE_PASSWORD")
fi

if [[ "${SHOPIFY_THEME_DEV_OPEN:-0}" == "1" ]]; then
  COMMAND+=(--open)
fi

print_step "Starting Shopify theme preview"
printf 'Local preview: http://%s:%s\n' "$THEME_DEV_HOST" "$THEME_DEV_PORT"
printf 'Running:'
printf ' %q' "${COMMAND[@]}"
printf '\n'

"${COMMAND[@]}"