#!/usr/bin/env sh
set -eu

start_ts=$(date +%s)

npx vitest run \
  tests/integration/api/if002-dto-validation.contract.test.ts \
  tests/integration/api/if002-error-status.contract.test.ts \
  tests/integration/security/common-error.contract.test.ts \
  tests/integration/security/audit-assertions.contract.test.ts \
  tests/integration/db/fnc013-rls-policy.contract.test.ts \
  >/tmp/contract-tests-runtime.log 2>&1

end_ts=$(date +%s)
elapsed=$((end_ts - start_ts))

printf 'contract_tests_elapsed_sec=%s\n' "$elapsed"
printf 'log_file=%s\n' "/tmp/contract-tests-runtime.log"
