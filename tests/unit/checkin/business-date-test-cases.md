# T-042 Business Date Test Cases (Red)

## Scope

- Task: `T-042`
- Target: `FNC-005`, `M-004`, `IF-002`, `SCR-002`
- Trace IDs: `FR-010`, `AC-010`, `TC-UT-FR-010-001`, `TC-UT-FR-010-002`, `TC-IT-FR-010-003`, `TC-IT-FR-010-004`

## Red判定

- 期待失敗: `M-004` の `resolveLogDate` が未実装のため、境界値判定を満たせず失敗する。
- 期待失敗: `POST /api/checkins` が `timezone/day_cutoff_time` を使った `log_date` 算出契約を満たせず失敗する。
- `T-043で実装`: 以下の Red ケースを Green 化する。

## Unit cases (M-004)

| ID | Condition | Input | Expected (Red stage) |
| -- | -- | -- | -- |
| TC-UT-FR-010-001 | `localTime < cutoff` | timezone=Asia/Tokyo, cutoff=03:00, local=02:59 | `log_date` 前日判定（未実装のため失敗） |
| TC-UT-FR-010-002 | `localTime == cutoff` | timezone=Asia/Tokyo, cutoff=03:00, local=03:00 | `log_date` 当日判定（未実装のため失敗） |
| TC-UT-FR-010-005 | lower boundary | cutoff=00:00, local=00:00 | 当日判定（未実装のため失敗） |
| TC-UT-FR-010-006 | upper boundary | cutoff=23:59, local=23:58/23:59 | 前日/当日境界（未実装のため失敗） |

## Integration cases (IF-002)

| ID | Condition | Input | Expected (Red stage) |
| -- | -- | -- | -- |
| TC-IT-FR-010-003 | timezone split | 同一UTCで USER-A(Tokyo), USER-B(UTC) | `log_date` がユーザー設定で分岐（未実装のため失敗） |
| TC-IT-FR-010-004 | invalid config prevention | 不正TZ/不正cutoff設定 | 設定更新で拒否され、算出処理に進まない（未実装のため失敗） |

## T-043 の責務境界

- `M-004` 単体: `nowUtc -> timezone local -> cutoff 比較 -> YYYY-MM-DD` を純粋関数で実装。
- `IF-002` 連携: `/api/checkins` で `M-004` を呼び、`log_date` を応答/永続化の契約に反映。
