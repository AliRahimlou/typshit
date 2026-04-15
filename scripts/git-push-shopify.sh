#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

load_env

DEPLOY_ON_PUSH="${SHOPIFY_DEPLOY_ON_GIT_PUSH:-0}"
TARGET_REMOTE="${SHOPIFY_GIT_PUSH_REMOTE:-origin}"
TARGET_BRANCH="${SHOPIFY_GIT_PUSH_BRANCH:-main}"
REMOTE_NAME="${1:-}"
REMOTE_URL="${2:-}"
MATCHED_COMMIT=""
SHOULD_DEPLOY=0

if [[ "$DEPLOY_ON_PUSH" != "1" ]]; then
  exit 0
fi

if [[ -z "$REMOTE_NAME" || "$REMOTE_NAME" != "$TARGET_REMOTE" ]]; then
  exit 0
fi

while IFS=' ' read -r local_ref local_oid remote_ref remote_oid; do
  if [[ "$remote_ref" == "refs/heads/$TARGET_BRANCH" ]]; then
    SHOULD_DEPLOY=1
    MATCHED_COMMIT="$local_oid"
    break
  fi
done

if [[ "$SHOULD_DEPLOY" != "1" ]]; then
  exit 0
fi

print_step "Starting background Shopify deploy for git push"
printf 'Git push target: %s/%s\n' "$REMOTE_NAME" "$TARGET_BRANCH"
printf 'Shopify deploy log: %s\n' "$(git_dir)/shopify-deploy.log"

nohup env \
  SHOPIFY_GIT_PUSH_REMOTE="$REMOTE_NAME" \
  SHOPIFY_GIT_PUSH_REMOTE_URL="$REMOTE_URL" \
  SHOPIFY_GIT_PUSH_BRANCH="$TARGET_BRANCH" \
  SHOPIFY_GIT_PUSH_COMMIT="$MATCHED_COMMIT" \
  bash "$SCRIPT_DIR/store-deploy-on-push.sh" >/dev/null 2>&1 &