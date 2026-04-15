#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env

LOG_FILE="$(git_dir)/shopify-deploy.log"
LOCK_DIR="$(git_dir)/shopify-deploy.lock"

log_line() {
  printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1" >> "$LOG_FILE"
}

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  log_line "Shopify deploy already running; skipping duplicate request for ${SHOPIFY_GIT_PUSH_REMOTE:-unknown}/${SHOPIFY_GIT_PUSH_BRANCH:-unknown}."
  exit 0
fi

cleanup() {
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}

trap cleanup EXIT

log_line "Starting Shopify deploy for remote=${SHOPIFY_GIT_PUSH_REMOTE:-unknown} branch=${SHOPIFY_GIT_PUSH_BRANCH:-unknown} commit=${SHOPIFY_GIT_PUSH_COMMIT:-unknown}."

if bash "$SCRIPT_DIR/deploy-store.sh" >> "$LOG_FILE" 2>&1; then
  log_line "Shopify deploy completed successfully."
else
  status=$?
  log_line "Shopify deploy failed with exit code $status."
  exit "$status"
fi