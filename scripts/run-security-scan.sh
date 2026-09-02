#!/usr/bin/env bash
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
config_file="$repo_dir/.env.strix.local"
strix_bin="$repo_dir/.tools/strix-venv/bin/strix"

if [[ ! -f "$config_file" ]]; then
  echo "Missing $config_file"
  echo "Copy .env.strix.example to .env.strix.local and add a valid LLM key."
  exit 1
fi

# This file is local and ignored by git. Keep keys in the environment only.
set -a
source "$config_file"
set +a

: "${STRIX_LLM:?STRIX_LLM is required}"
: "${OPENAI_API_KEY:?OPENAI_API_KEY is required}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required and must be running."
  exit 1
fi

if [[ ! -x "$strix_bin" ]]; then
  echo "Strix is not installed at $strix_bin"
  echo "Install it with: python3 -m venv .tools/strix-venv && .tools/strix-venv/bin/pip install strix-agent"
  exit 1
fi

exec "$strix_bin" \
  --non-interactive \
  --target "$repo_dir" \
  --scan-mode standard \
  --scope-mode full \
  --max-budget "${STRIX_MAX_BUDGET:-10}" \
  --instruction 'Focus on Supabase RLS, authentication, admin/verification workflow, IDOR, tenant isolation, poll vote abuse, chat membership, fundraiser/payment authorization, secrets, and the Next.js + Flutter data boundary. Do not print or include secret values, tokens, passwords, or .env contents in reports.'
