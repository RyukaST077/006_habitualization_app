# Habit Lifecycle Contract Test Cases (T-039 / Red)

## トレース対象
- FR-006, FR-007, FR-008, FR-009
- AC-006, AC-007, AC-008, AC-009
- TC-IT-FR-006-001, TC-IT-FR-006-002, TC-IT-FR-007-003, TC-ST-FR-008-004, TC-ST-FR-009-005
- SCR-003, SCR-004

## 正常系観点（Green候補）
- FR-006: `POST /api/habits` で `name(1..80)` / `display_order(1..9999)` を受け取り作成できる。
- FR-007: `PATCH /api/habits/{habit_id}` で本人習慣のみ更新できる。
- FR-008: `POST /api/habits/{habit_id}/archive` で `status=archived` と `archived_at` が付与される。
- FR-009: `POST /api/habits/{habit_id}/resume` で `status=active` に戻る。

## 異常系観点（EX）
- EX-003: 入力不備（name=0文字/81文字、display_order範囲外）は `VALIDATION_ERROR`。
- EX-004: 他者習慣の更新/状態遷移は `FORBIDDEN`。
- 競合状態は `DOMAIN_CONFLICT` として扱う。

## Red判定条件
- Red判定: 作成/更新/アーカイブ/再開の契約が未実装または不一致なら失敗する。
- 期待失敗: `VALIDATION_ERROR`, `FORBIDDEN`, `DOMAIN_CONFLICT` が契約どおり返らない。
- T-040で実装: API/UseCase/UI の実装は T-040 で Green 化する。
