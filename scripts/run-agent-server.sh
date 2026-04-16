#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env

ROOT="$(repo_root)"
MODE="${1:-start}"
TSX_BIN="$ROOT/node_modules/.bin/tsx"
COMMAND=("$TSX_BIN")

if [[ ! -x "$TSX_BIN" ]]; then
  echo "Local tsx binary not found. Run npm install first." >&2
  exit 1
fi

ensure_node18

if [[ "$MODE" == "watch" ]]; then
  COMMAND+=(watch)
fi

COMMAND+=("$ROOT/server.ts")

cd "$ROOT"
exec "${COMMAND[@]}"