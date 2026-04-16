#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env

ROOT="$(repo_root)"
REQUESTED_API_PORT="${PORT:-8080}"
API_PORT="$REQUESTED_API_PORT"
THEME_DEV_HOST="${SHOPIFY_THEME_DEV_HOST:-127.0.0.1}"
REQUESTED_THEME_DEV_PORT="${SHOPIFY_THEME_DEV_PORT:-9292}"
THEME_DEV_PORT="$REQUESTED_THEME_DEV_PORT"
SERVER_PID=""
THEME_PID=""
REUSE_EXISTING_API="0"

if curl -fsS "http://127.0.0.1:$API_PORT/health" >/dev/null 2>&1; then
  REUSE_EXISTING_API="1"
elif port_is_open 127.0.0.1 "$API_PORT"; then
  API_PORT="$(find_available_port 127.0.0.1 "$((REQUESTED_API_PORT + 1))")"
fi

if port_is_open "$THEME_DEV_HOST" "$THEME_DEV_PORT"; then
  THEME_DEV_PORT="$(find_available_port "$THEME_DEV_HOST" "$((REQUESTED_THEME_DEV_PORT + 1))")"
fi

cleanup() {
  local exit_code=$?

  if [[ -n "$THEME_PID" ]] && kill -0 "$THEME_PID" >/dev/null 2>&1; then
    kill "$THEME_PID" >/dev/null 2>&1 || true
  fi

  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi

  wait >/dev/null 2>&1 || true
  exit "$exit_code"
}

trap cleanup EXIT INT TERM

if [[ "$REUSE_EXISTING_API" == "1" ]]; then
  print_step "Reusing agent API at http://127.0.0.1:$API_PORT"
elif [[ "$API_PORT" != "$REQUESTED_API_PORT" ]]; then
  print_step "Agent API port $REQUESTED_API_PORT is busy; using $API_PORT instead"
fi

if [[ "$THEME_DEV_PORT" != "$REQUESTED_THEME_DEV_PORT" ]]; then
  print_step "Storefront preview port $REQUESTED_THEME_DEV_PORT is busy; using $THEME_DEV_PORT instead"
fi

print_step "Starting full local dev stack"
printf 'Storefront preview: http://%s:%s\n' "$THEME_DEV_HOST" "$THEME_DEV_PORT"
printf 'Agent API: http://127.0.0.1:%s\n' "$API_PORT"

if [[ "$REUSE_EXISTING_API" != "1" ]]; then
  (
    cd "$ROOT"
    ensure_node18
    PORT="$API_PORT" npm run dev
  ) &
  SERVER_PID=$!
fi

(
  cd "$ROOT"
  SHOPIFY_THEME_DEV_HOST="$THEME_DEV_HOST" SHOPIFY_THEME_DEV_PORT="$THEME_DEV_PORT" bash "$SCRIPT_DIR/preview-theme.sh"
) &
THEME_PID=$!

if [[ -n "$SERVER_PID" ]]; then
  wait -n "$SERVER_PID" "$THEME_PID"
else
  wait "$THEME_PID"
fi