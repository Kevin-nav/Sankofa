#!/bin/sh
set -eu

SEED_MARKER_PATH="${SEED_MARKER_PATH:-/data/.sakofa-seeded}"
PRISMA_AUTO_ACCEPT_DATA_LOSS="${PRISMA_AUTO_ACCEPT_DATA_LOSS:-true}"

npx prisma generate

db_push_output_file="$(mktemp)"
set +e
npx prisma db push --skip-generate >"$db_push_output_file" 2>&1
db_push_status=$?
set -e

if [ "$db_push_status" -ne 0 ]; then
  cat "$db_push_output_file"

  if [ "$PRISMA_AUTO_ACCEPT_DATA_LOSS" = "true" ] && grep -q -- "--accept-data-loss" "$db_push_output_file"; then
    echo "Prisma requested --accept-data-loss; retrying with flag."
    npx prisma db push --skip-generate --accept-data-loss
  else
    echo "Prisma schema sync failed; exiting."
    exit "$db_push_status"
  fi
fi

rm -f "$db_push_output_file"

if [ "${SEED_ON_BOOT:-false}" = "true" ] && [ ! -f "$SEED_MARKER_PATH" ]; then
  echo "Seeding initial Sankofa data..."
  node prisma/seed-runtime.js
  touch "$SEED_MARKER_PATH"
fi

exec node dist/main.js
