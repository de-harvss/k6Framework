#!/usr/bin/env bash
# Usage: ./scripts/run.sh <scenario> <test-file>
# Example: ./scripts/run.sh smoke dist/tests/api/todos-api/health.test.js
#          ./scripts/run.sh load  dist/tests/api/todos-api/todos.test.js
#
# To target a different URL: add --env DEV_BASE_URL=http://other-host:5058 at the end.

set -euo pipefail

SCENARIO=${1:-smoke}
TEST_FILE=${2:-dist/tests/api/todos-api/todos.test.js}

npm run build

k6 run \
  --env ENV=dev \
  --env SCENARIO="$SCENARIO" \
  "$TEST_FILE" \
  "${@:3}"
