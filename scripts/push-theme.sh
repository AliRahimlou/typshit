#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env
ensure_node20

SHOPIFY_BIN="$(shopify_cli_bin)"

if [[ -z "$SHOPIFY_BIN" ]]; then
  echo "Shopify CLI is required for theme pushes. Install dependencies first so the local CLI binary is available, then authenticate with your store." >&2
  exit 1
fi

ROOT="$(repo_root)"
THEME_PATH="${SHOPIFY_THEME_PATH:-theme}"
THEME_ROOT="$ROOT/$THEME_PATH"
THEME_STORE="${SHOPIFY_THEME_STORE:-${SHOPIFY_STORE_DOMAIN:-}}"
THEME_ID="${SHOPIFY_THEME_ID:-}"

require_env THEME_STORE "Set SHOPIFY_THEME_STORE in .env so the theme push knows which store to target."
require_env THEME_ID "Set SHOPIFY_THEME_ID in .env so theme pushes stay non-interactive and land on the intended theme."

if [[ ! -d "$THEME_ROOT" ]]; then
  echo "Theme path '$THEME_ROOT' does not exist." >&2
  exit 1
fi

COMMAND=(
  "$SHOPIFY_BIN"
  theme push
  --store "$THEME_STORE"
  --theme "$THEME_ID"
  --path "$THEME_ROOT"
  --nodelete
  --only "assets/*"
  --only "sections/*"
  --only "snippets/*"
  --only "templates/*"
)

if [[ -n "${SHOPIFY_CLI_THEME_TOKEN:-}" ]]; then
  COMMAND+=(--password "$SHOPIFY_CLI_THEME_TOKEN")
fi

if [[ "${SHOPIFY_THEME_ALLOW_LIVE:-0}" == "1" ]]; then
  COMMAND+=(--allow-live)
fi

if [[ "${SHOPIFY_THEME_PUBLISH_ON_PUSH:-0}" == "1" ]]; then
  COMMAND+=(--publish)
fi

print_step "Pushing theme kit to Shopify"
printf 'Running:'
printf ' %q' "${COMMAND[@]}"
printf '\n'

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  exit 0
fi

"${COMMAND[@]}"