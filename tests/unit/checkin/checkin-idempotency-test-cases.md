# T-045 FNC-006 Red観点（チェックイン登録・冪等・archived拒否）

## 対象/トレース

- 対象要件: `FR-011`, `FR-012`, `FR-013`
- 受け入れ: `AC-011`, `AC-012`, `AC-013`
- テスト仕様: `TC-IT-FR-011-001`, `TC-IT-FR-012-002`, `TC-IT-FR-013-003`, `TC-IT-FR-011-004`, `TC-ST-FR-013-005`
- 対象設計: `SCR-002`, `SCR-004`, `IF-002`, `M-005`, `TBL-002`, `TBL-003`

## Red判定（T-045時点）

- 期待失敗: active習慣の初回チェックインで `idempotent=false` が返る契約が未実装の場合に失敗。
- 期待失敗: 同一 `habit_id + log_date` 再実行時に `idempotent=true` / DB増分0 が担保できない場合に失敗。
- 期待失敗: archived習慣への達成操作で `409 DOMAIN_CONFLICT` と再開導線キーワードが返らない場合に失敗。
- 期待失敗: 本人外 `habit_id` のチェックイン要求が `403 FORBIDDEN` で拒否されない場合に失敗。
- 期待失敗: 再開導線（`SCR-004`）経由の再試行条件が契約上観測できない場合に失敗。

## ケース一覧

| TC-ID | 観点 | 前提条件 | 期待値（Redで固定する契約） |
| -- | -- | -- | -- |
| TC-IT-FR-011-001 | active初回登録 | USER-A active習慣あり | `/api/checkins` 成功・`idempotent=false` |
| TC-IT-FR-012-002 | 同日冪等 | 同一habit同日ログ1件あり | 成功応答・`idempotent=true`・DB件数増分0 |
| TC-IT-FR-013-003 | archived拒否 | USER-A archived習慣あり | `409 DOMAIN_CONFLICT`・再開導線表示 |
| TC-IT-FR-011-004 | 認可 | USER-B習慣IDが存在 | USER-A送信時に`403 FORBIDDEN`・DB不変 |
| TC-ST-FR-013-005 | UX導線 | archived習慣が存在 | 再開後に再チェックイン可能（T-046でGreen化） |

## T-046でGreen化する責務境界

- Route (`src/app/api/checkins/route.ts`):
  - DTO検証、認証済みユーザー解決、`CheckinService` 呼び出し、IF-002応答整形。
- Service (`src/server/application/checkin/CheckinService.ts`):
  - active/archived/本人スコープ判定、`log_date` 算出、冪等判定の結果整形。
- Repository (`src/server/infrastructure/repositories/HabitRepository.ts`):
  - `habit_logs` への upsert、`(habit_id, log_date)` 一意制約に基づく増分制御。
