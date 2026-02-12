# FNC-007 Checkin Cancel Red Test Cases (T-048)

## Scope
- Target requirements: `FR-014`, `AC-014`, `FR-025`
- Target design: `SCR-002`, `IF-002`, `TBL-003`, `M-005`
- Goal: keep Red expectations until `T-049` implements cancel flow.

## Red Policy
- This document defines expected failures for `T-048` Red.
- Tests should fail when cancel behavior is not implemented.
- `T-049` will turn these cases Green.

## Cases
| Case ID | Trace | Scenario | Red expected failure |
|---|---|---|---|
| TC-IT-FR-014-001 | `FR-014`, `AC-014` | same-day cancel succeeds | Cancel contract keywords or route path missing |
| TC-IT-FR-014-002 | `FR-014`, `AC-014` | out-of-day cancel is rejected | `CHECKIN_CANCEL_NOT_ALLOWED` or `DOMAIN_CONFLICT` path missing |
| TC-IT-FR-014-003 | `FR-014`, `FR-025` | user A tries to cancel user B log | `403 FORBIDDEN` / `RLS` owner-scope keywords missing |
| TC-ST-FR-014-004 | `FR-014`, `AC-014` | audit records success/failure | `CHECKIN_CANCEL` trace keywords missing |

## Responsibility Boundary for T-049
- Route (`src/app/api/checkins/route.ts`): `DELETE /api/checkins/{habitId}` contract and request validation.
- Service (`src/server/application/checkin/CheckinService.ts`): `cancelTodayCheckin` business rules and date boundary.
- Repository (`src/server/infrastructure/repositories/HabitRepository.ts`): owner-scope delete and DB unchanged checks.

## Notes
- Keep wording aligned with `TC-FNC-007_チェックイン取消.md`.
- Red status is intentional before implementing cancel flow.
