# IF-002 DTO/Validation Test Cases (T-026 / Red)

## 対象エンドポイント
- GET /api/home/habits
- POST /api/habits
- PATCH /api/habits/{id}
- POST /api/checkins
- DELETE /api/checkins/{habitId}
- PATCH /api/settings/profile
- POST /api/settings/withdrawal

## DTO/Validation観点
- Authorization ヘッダー（Bearer JWT）必須。
- Content-Type: application/json 必須（GET以外）。
- X-Request-Id は任意だが、レスポンス trace_id を返却する。
- `POST /api/habits`: `name`, `displayOrder` 必須。
- `PATCH /api/habits/{id}`: `id` がUUID形式、payload が空でないこと。
- `POST /api/checkins`: `habitId`, `logDate`, `checkedInAt` 必須。
- `PATCH /api/settings/profile`: `timezone`, `dayCutoffTime` 必須。
- `POST /api/settings/withdrawal`: 冪等トークン/本人確認の入力契約を固定する。

## 異常系観点
- 403 FORBIDDEN: 本人データ以外へアクセスした場合。
- 409 DOMAIN_CONFLICT: archived習慣へのcheckin、状態遷移競合など。
- 500 INTERNAL_ERROR: 予期せぬ障害時に trace_id を返す。

## 期待レスポンス契約
- 正常系: `{ "result": "success", "trace_id": "uuid" }`
- 異常系: `{ "result": "error", "code": "<ERROR_CODE>", "trace_id": "uuid" }`

## Red判定
- IF-002 対象ルートが未実装の場合、契約テストは失敗する。
- DTO検証が未実装の場合、Validation契約テストは失敗する。
- 403/409/500 の code と trace_id 契約が満たされない場合、異常系契約テストは失敗する。

## 期待失敗ログ（T-027前）
- `IF-002 route contract not implemented`
- `Expected validation guard for required fields`
- `Expected error response code FORBIDDEN/DOMAIN_CONFLICT/INTERNAL_ERROR`

