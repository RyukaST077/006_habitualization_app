# Contract Test Runtime

## Purpose
Track runtime of core contract tests after Phase3 refactors.

## Measurement Steps
1. Run `sh scripts/measure-contract-tests.sh` (or `npm run test:contracts:measure`).
2. Confirm `contract_tests_elapsed_sec=<seconds>` is printed to stdout.
3. Check details in `/tmp/contract-tests-runtime.log` when needed.

## Output
- `contract_tests_elapsed_sec=<seconds>`
- `log_file=/tmp/contract-tests-runtime.log`

## Record (latest)
- date: 2026-02-26
- value: `contract_tests_elapsed_sec=1`
- note: T-032 PR-003 measurement flow fixed and baseline refreshed
