#!/usr/bin/env bash

set -euo pipefail

repo_root() {
  cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd
}

git_dir() {
  local root
  local dir
  root="$(repo_root)"
  dir="$(cd "$root" && git rev-parse --git-dir)"

  if [[ "$dir" != /* ]]; then
    dir="$root/$dir"
  fi

  printf '%s' "$dir"
}

load_env() {
  local root
  local line
  local key
  local value
  root="$(repo_root)"

  if [[ -f "$root/.env" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      line="${line%$'\r'}"

      if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
        continue
      fi

      if [[ "$line" != *=* ]]; then
        continue
      fi

      key="${line%%=*}"
      value="${line#*=}"

      key="${key#"${key%%[![:space:]]*}"}"
      key="${key%"${key##*[![:space:]]}"}"

      if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        continue
      fi

      if [[ "$value" =~ ^".*"$ || "$value" =~ ^'.*'$ ]]; then
        value="${value:1:-1}"
      fi

      export "$key=$value"
    done < "$root/.env"
  fi
}

ensure_node_version() {
  local required_major="$1"
  local current_major="0"

  if command -v node >/dev/null 2>&1; then
    current_major="$(node -p "process.versions.node.split('.')[0]")"
  fi

  if [[ "$current_major" -ge "$required_major" ]]; then
    return 0
  fi

  if [[ -s "${NVM_DIR:-$HOME/.nvm}/nvm.sh" ]]; then
    # shellcheck disable=SC1090
    source "${NVM_DIR:-$HOME/.nvm}/nvm.sh"
    nvm use "$required_major" >/dev/null
    return 0
  fi

  echo "Node $required_major+ is required. Install it or make sure nvm can switch to Node $required_major." >&2
  return 1
}

ensure_node18() {
  ensure_node_version 18
}

ensure_node20() {
  ensure_node_version 20
}

shopify_cli_bin() {
  local root
  root="$(repo_root)"

  if [[ -x "$root/node_modules/.bin/shopify" ]]; then
    printf '%s' "$root/node_modules/.bin/shopify"
    return 0
  fi

  if command -v shopify >/dev/null 2>&1; then
    command -v shopify
    return 0
  fi

  printf '%s' ""
  return 0
}

require_command() {
  local name="$1"
  local help_text="$2"

  if ! command -v "$name" >/dev/null 2>&1; then
    echo "$help_text" >&2
    return 1
  fi
}

require_env() {
  local name="$1"
  local help_text="$2"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    echo "$help_text" >&2
    return 1
  fi
}

agent_base_url() {
  if [[ -n "${AGENT_BASE_URL:-}" ]]; then
    printf '%s' "$AGENT_BASE_URL"
    return 0
  fi

  printf 'http://127.0.0.1:%s' "${PORT:-8080}"
}

wait_for_health() {
  local base_url="$1"
  local attempt

  for attempt in $(seq 1 40); do
    if curl -fsS "$base_url/health" >/dev/null 2>&1; then
      return 0
    fi

    sleep 1
  done

  echo "Agent server did not become healthy at $base_url/health in time." >&2
  return 1
}

SERVER_PID=""
SERVER_LOG=""

start_agent_server_if_needed() {
  local root base_url
  root="$(repo_root)"
  base_url="$(agent_base_url)"

  if curl -fsS "$base_url/health" >/dev/null 2>&1; then
    return 0
  fi

  ensure_node18

  SERVER_LOG="${TYPSH_AGENT_LOG:-$root/.typsh-agent-server.log}"

  (
    cd "$root"
    npm run start >"$SERVER_LOG" 2>&1 &
    echo $! > "$root/.typsh-agent-server.pid"
  )

  SERVER_PID="$(cat "$root/.typsh-agent-server.pid")"
  wait_for_health "$base_url"
}

cleanup_agent_server() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}

print_step() {
  printf '\n[%s] %s\n' "typsh" "$1"
}