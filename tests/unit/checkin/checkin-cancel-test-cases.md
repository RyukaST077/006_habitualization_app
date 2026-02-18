# FNC-007 Checkin Cancel Test Cases (T-050 Refactor)

## Scope
- Target requirements: `FR-014`, `AC-014`, `FR-025`
- Target design: `SCR-002`, `IF-002`, `TBL-003`, `M-005`
- Goal: preserve cancel contract and traceability after `T-050` refactor.

## Case Matrix
### Normal
| Case ID | Trace | Scenario | Expected result |
|---|---|---|---|
| TC-IT-FR-014-001 | `FR-014`, `AC-014` | same-day cancel succeeds | `DELETE /api/checkins/{habitId}` succeeds and same-day `log_date` path exists |

### Abnormal
| Case ID | Trace | Scenario | Expected result |
|---|---|---|---|
| TC-IT-FR-014-002 | `FR-014`, `AC-014` | out-of-day cancel is rejected | `CHECKIN_CANCEL_NOT_ALLOWED` and `DOMAIN_CONFLICT(409)` mapping, `DB_UNCHANGED` |

### Authorization
| Case ID | Trace | Scenario | Expected result |
|---|---|---|---|
| TC-IT-FR-014-003 | `FR-014`, `FR-025` | user A tries to cancel user B log | `403 FORBIDDEN`, `RLS` owner boundary, `user_id` scope |

### Audit
| Case ID | Trace | Scenario | Expected result |
|---|---|---|---|
| TC-ST-FR-014-004 | `FR-014`, `AC-014` | audit records success/failure | `CHECKIN_CANCEL:success` and `CHECKIN_CANCEL:failure` trace markers exist |

## Responsibility Boundary
- Route (`src/app/api/checkins/route.ts`): `DELETE /api/checkins/{habitId}` contract and request validation.
- Service (`src/server/application/checkin/CheckinService.ts`): `cancelTodayCheckin` business rules and date boundary.
- Repository (`src/server/infrastructure/repositories/HabitRepository.ts`): owner-scope delete and DB unchanged checks.

## Notes
- Keep wording aligned with `TC-FNC-007_チェックイン取消.md`.
- This table is maintained as regression documentation for `T-050`.
