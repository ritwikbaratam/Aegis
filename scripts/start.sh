#!/usr/bin/env sh
set -eu
PROJECT_ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$PROJECT_ROOT"
printf '%s\n' 'Starting AEGIS at http://localhost:8080'
exec node backend/src/server.js
