#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

SKIP_DATA=0
SKIP_THEME=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-data)
      SKIP_DATA=1
      ;;
    --skip-theme)
      SKIP_THEME=1
      ;;
    --dry-run)
      export DRY_RUN=1
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
  shift
done

if [[ "$SKIP_DATA" == "0" ]]; then
  bash "$SCRIPT_DIR/sync-store-data.sh"
fi

if [[ "$SKIP_THEME" == "0" ]]; then
  bash "$SCRIPT_DIR/push-theme.sh"
fi