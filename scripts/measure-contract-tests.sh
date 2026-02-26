#!/bin/sh
set -eu

LOG_FILE="/tmp/contract-tests-runtime.log"
START_TS=$(date +%s)

npm run test -- \
  tests/integration/repositories/*.spec.ts \
  tests/integration/common/t-030-*.spec.ts \
  tests/integration/security/fnc-013-*.spec.ts \
  >"$LOG_FILE" 2>&1

END_TS=$(date +%s)
ELAPSED_SEC=$((END_TS - START_TS))

printf 'contract_tests_elapsed_sec=%s\n' "$ELAPSED_SEC"
printf 'log_file=%s\n' "$LOG_FILE"
