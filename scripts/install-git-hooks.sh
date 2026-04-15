#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=./common.sh
source "$SCRIPT_DIR/common.sh"

ROOT="$(repo_root)"

print_step "Installing repository git hooks"
git -C "$ROOT" config core.hooksPath .githooks

printf 'Configured core.hooksPath=%s\n' '.githooks'
printf 'Enable git-push deploys by setting %s in %s\n' 'SHOPIFY_DEPLOY_ON_GIT_PUSH=1' '.env'