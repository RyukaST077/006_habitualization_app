# IF-004 policy_settings更新

## 1. 概要
- 目的: terms/privacy最新版を更新し、再同意判定の基準を変更する。
- トレース: ← [FNC-002](../../01_Project_Design/05_Feature_List.md#L71), ← [FNC-003](../../01_Project_Design/05_Feature_List.md#L72), ← [FR-026](../../01_Project_Design/01_Requirements.md#L165)

## 2. 接続情報
- 接続先システム: Supabase Postgres。
- 環境: 運用者実行（service role）。
- Endpoint: `/api/internal/policy-settings` または SQLテンプレート実行。
- 認証: service role key（サーバー限定）。

## 3. リクエスト仕様
### ボディ
```json
{
  "policy_type": "terms",
  "new_version": "v1.1",
  "effective_from": "2026-03-01T00:00:00Z",
  "document_url": "https://example.com/terms-v1.1"
}
```

| 項目名 | 型 | 必須 | 説明 |
| -- | -- | -- | -- |
| policy_type | string | 〇 | terms/privacy |
| new_version | string | 〇 | 新版 |
| effective_from | string | 〇 | 適用開始時刻 |
| document_url | string | 〇 | 文書URL |

## 4. レスポンス仕様
### 正常系
```json
{
  "updated": true,
  "old_version": "v1.0",
  "new_version": "v1.1"
}
```

### エラー系
| Status | Code | 説明 |
| -- | -- | -- |
| 400 | INVALID_POLICY_TYPE | 種別不正 |
| 409 | VERSION_CONFLICT | 版競合 |
| 500 | POLICY_UPDATE_FAILED | 更新失敗 |

## 5. エラー時の挙動・リカバリ
- 失敗時は旧versionを維持（ロールバック）。
- 成功時は `audit_logs` に `old_version/new_version` を必須記録。
