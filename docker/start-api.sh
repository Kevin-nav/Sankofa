#!/bin/sh
set -eu

SEED_MARKER_PATH="${SEED_MARKER_PATH:-/data/.sakofa-seeded}"

npx prisma generate
npx prisma db push

if [ "${SEED_ON_BOOT:-false}" = "true" ] && [ ! -f "$SEED_MARKER_PATH" ]; then
  echo "Seeding initial Sankofa data..."
  node prisma/seed-runtime.js
  touch "$SEED_MARKER_PATH"
fi

exec node dist/main.js
