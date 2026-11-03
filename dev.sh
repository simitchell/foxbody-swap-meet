#!/usr/bin/env bash
# ------------------------------------------------------------------
# dev.sh — spin up Fox Body Swap Meet locally (Postgres + Django + Vite)
#
# Usage (from anywhere):
#   ~/Repos/foxbody-swap-meet/dev.sh
#   ~/Repos/foxbody-swap-meet/dev.sh --migrate   # also run migrations first
#
# Press Ctrl+C once to stop BOTH servers.
# ------------------------------------------------------------------

set -euo pipefail

# ---- Config ------------------------------------------------------
PROJECT_ROOT="$HOME/Repos/foxbody-swap-meet"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DJANGO_PORT=8000
PG_BIN="/Applications/Postgres.app/Contents/Versions/latest/bin"

RUN_MIGRATE=false
[[ "${1:-}" == "--migrate" ]] && RUN_MIGRATE=true

# ---- Local-only overrides: NEVER hit prod ------------------------
# backend/.env already holds local-only values; these exports are a backstop
# in case it ever gets prod values back. Shell exports win over .env, so
# Django uses the local database, local media storage, and skips the real
# Rekognition call. Exported before any Django command so --migrate is
# covered too.
export DATABASE_URL="postgres://$(whoami)@localhost:5432/foxbody_local"
export DEBUG=true
export AWS_ACCESS_KEY_ID=
export SKIP_IMAGE_MODERATION=true

# ---- Pretty output -----------------------------------------------
blue()  { printf "\033[1;34m%s\033[0m\n" "$*"; }
green() { printf "\033[1;32m%s\033[0m\n" "$*"; }
red()   { printf "\033[1;31m%s\033[0m\n" "$*" >&2; }

# ---- 1. Find manage.py and the venv ------------------------------
# Search instead of hard-coding, so the script survives folder moves.
MANAGE_PY=$(find "$PROJECT_ROOT/backend" -name manage.py -not -path "*/venv/*" -not -path "*/node_modules/*" | head -n 1)
if [[ -z "$MANAGE_PY" ]]; then
  red "Couldn't find manage.py under $PROJECT_ROOT/backend"; exit 1
fi
DJANGO_DIR=$(dirname "$MANAGE_PY")

VENV_ACTIVATE=$(find "$PROJECT_ROOT" -maxdepth 4 -path "*venv/bin/activate" -not -path "*/node_modules/*" | head -n 1)
if [[ -z "$VENV_ACTIVATE" ]]; then
  red "Couldn't find a venv (looked for */venv/bin/activate)"; exit 1
fi

blue "Django dir: $DJANGO_DIR"
blue "venv:       $VENV_ACTIVATE"

# ---- 2. Start Postgres.app and wait until it accepts connections -
blue "Starting Postgres.app..."
open -a Postgres

if [[ -x "$PG_BIN/pg_isready" ]]; then
  for i in {1..20}; do
    if "$PG_BIN/pg_isready" -q; then green "Postgres is ready."; break; fi
    [[ $i -eq 20 ]] && { red "Postgres didn't come up. Open Postgres.app and click Start."; exit 1; }
    sleep 1
  done
else
  blue "pg_isready not found; giving Postgres a few seconds..."
  sleep 4
fi

# ---- Open the project in VS Code ---------------------------------
if command -v code >/dev/null 2>&1; then
  code "$PROJECT_ROOT"
else
  open -a "Visual Studio Code" "$PROJECT_ROOT"
fi

# ---- 3. Make sure the Django port is free ------------------------
if lsof -ti tcp:$DJANGO_PORT >/dev/null 2>&1; then
  red "Port $DJANGO_PORT is already in use (an old runserver?)."
  red "Stop it with:  kill \$(lsof -ti tcp:$DJANGO_PORT)"
  exit 1
fi

# ---- 4. Clean shutdown: Ctrl+C stops both servers ----------------
PIDS=()
cleanup() {
  echo
  blue "Shutting down..."
  for pid in "${PIDS[@]}"; do
    pkill -P "$pid" 2>/dev/null || true   # child processes (Vite/Django reloader)
    kill "$pid" 2>/dev/null || true
  done
  green "All stopped. (Postgres.app is left running.)"
}
trap cleanup EXIT INT TERM

# ---- 5. Django backend -------------------------------------------
(
  cd "$DJANGO_DIR"
  # shellcheck disable=SC1090
  source "$VENV_ACTIVATE"
  if $RUN_MIGRATE; then
    echo "[django] running migrations..."
    python3 manage.py migrate
  fi
  python3 manage.py runserver "$DJANGO_PORT" 2>&1 | sed -u 's/^/[django] /'
) &
PIDS+=($!)

# ---- 6. Vite frontend --------------------------------------------
(
  cd "$FRONTEND_DIR"
  [[ -d node_modules ]] || { echo "[vite] node_modules missing, running npm install..."; npm install; }
  npm run dev 2>&1 | sed -u 's/^/[vite]   /'
) &
PIDS+=($!)

green "Backend:  http://127.0.0.1:$DJANGO_PORT"
green "Frontend: http://localhost:5173  (Vite prints the exact URL below)"
blue  "Ctrl+C to stop both."

# Wait for either server to exit; if one crashes, the trap stops the other.
wait -n 2>/dev/null || wait
