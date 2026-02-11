# 外部インターフェース設計共通

## 0. ドキュメント情報
| 項目 | 内容 |
| -- | -- |
| システム名 | HabiMake |
| 対象範囲 | 詳細設計（IF設計） |
| バージョン | v0.1 |
| 作成日 | 2026-02-11 |
| 作成者 | Codex |
| 承認者 | aliyell |
| 正本トレース起点 | `docs/01_Project_Design/05_Feature_List.md` |

## 1. インターフェース一覧
| IF ID | 連携システム | 名称 | 方式 | プロトコル | 方向 | 頻度 | 関連FNC | 詳細 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| IF-001 | Supabase Auth + Google OAuth | 認証セッション確立 | SDK/API | HTTPS | Out | 都度 | FNC-001 | [IF-001_認証セッション確立](./IF-001_認証セッション確立.md) |
| IF-002 | Supabase Postgres API | アプリ業務データCRUD | SDK + SQL | HTTPS | Out | 都度 | FNC-002..008,010..013 | [IF-002_アプリ業務データAPI](./IF-002_アプリ業務データAPI.md) |
| IF-003 | Supabase Edge Functions + メール通知GW | 閾値通知送信 | Event + API | HTTPS | Out | 閾値到達時 | FNC-009 | [IF-003_監視通知メール](./IF-003_監視通知メール.md) |
| IF-004 | policy_settings更新IF（内部） | ポリシー版更新 | SQL/API | HTTPS | In | 任意 | FNC-002,003 | [IF-004_policy_settings更新](./IF-004_policy_settings更新.md) |
| IF-005 | Supabase SQL Editor / CLI | 運用CLI/SQL抽出 | SQL | HTTPS | In | 手動（運用者実行） | FNC-009,011,012,013 | [IF-005_運用CLI_SQL](./IF-005_運用CLI_SQL.md) |

## 2. 共通仕様
### 2.1 セキュリティ
- 通信暗号化: TLS 1.2以上。
- 認証方式:
  - IF-001: OAuth2/OIDC（Google + Supabase）。
  - IF-002/IF-004: Supabase JWT + service role（サーバーのみ）。
  - IF-005: Supabase管理者権限。
- 秘密情報管理: Vercel/SupabaseのSecrets機構を使用。

### 2.2 タイムアウト/リトライ
| 区分 | Connect | Read | リトライ | Backoff |
| -- | -- | -- | -- | -- |
| IF-001 | 5秒 | 30秒 | 1回 | 500ms |
| IF-002 | 3秒 | 10秒 | 2回 | 300ms, 900ms |
| IF-003 | 5秒 | 15秒 | 3回 | 1s, 3s, 9s |
| IF-004 | 3秒 | 10秒 | 1回 | 500ms |
| IF-005 | 10秒 | 60秒 | 再実行は手動 | - |

### 2.3 共通エラーレスポンス
```json
{
  "code": "FORBIDDEN",
  "message": "アクセス権限がありません",
  "trace_id": "uuid",
  "requirement_id": "FR-025"
}
```

### 2.4 ステータスコード方針
- 200/201: 正常。
- 400: 入力エラー。
- 401: 認証エラー。
- 403: 権限エラー。
- 409: 業務競合（重複/状態不整合）。
- 500: システムエラー。

## 3. 運用ルール
- IF変更時は関連する `SCR/TBL/M` を同PRで更新する。
- IF-003/IF-005 の運用手順は Runbook 化し、受入期間中は日次で疎通確認する。

## 4. 確定事項
- IF-003 は Supabase Edge Functions による閾値判定・通知送信を採用する。
- IF-005 は手動実行を正とし、定時自動実行はMVPでは採用しない。

## 改訂履歴
| バージョン | 日付 | 変更内容 | 承認者 |
| -- | -- | -- | -- |
| v0.1 | 2026-02-11 | 初版 | - |
