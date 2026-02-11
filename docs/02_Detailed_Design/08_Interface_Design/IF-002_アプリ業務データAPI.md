# IF-002 アプリ業務データAPI

## 1. 概要
- 目的: 習慣/チェックイン/設定/同意/監査の業務データを操作する。
- トレース: ← [FNC-002](../../01_Project_Design/05_Feature_List.md#L71) 〜 ← [FNC-013](../../01_Project_Design/05_Feature_List.md#L82)

## 2. 接続情報
- 接続先システム: Supabase Postgres。
- Endpoint: `/api/*`（Next.js Route Handler）
- Method/Protocol: HTTPS + JSON。
- 認証: Bearer JWT（Supabase session）。

## 3. リクエスト仕様
### 共通ヘッダー
| 項目名 | 必須 | 説明 | 備考 |
| -- | -- | -- | -- |
| Authorization | 〇 | Bearer JWT | |
| Content-Type | 〇 | application/json | |
| X-Request-Id | - | トレースID | 任意 |

### 代表エンドポイント
| Method | Path | 用途 | 関連FNC |
| -- | -- | -- | -- |
| GET | `/api/home/habits` | active習慣一覧取得 | FNC-006,008 |
| POST | `/api/habits` | 習慣作成 | FNC-004 |
| PATCH | `/api/habits/{id}` | 習慣更新 | FNC-004 |
| POST | `/api/checkins` | チェックイン登録 | FNC-005,006 |
| DELETE | `/api/checkins/{habitId}` | チェックイン取消 | FNC-007 |
| PATCH | `/api/settings/profile` | TZ/締め時刻更新 | FNC-010,011 |
| POST | `/api/settings/withdrawal` | 退会要求 | FNC-012 |

## 4. レスポンス仕様
### 正常系
```json
{
  "result": "success",
  "trace_id": "uuid"
}
```

### エラー系
| Status | Code | 説明 |
| -- | -- | -- |
| 400 | VALIDATION_ERROR | 入力不正 |
| 403 | FORBIDDEN | 本人データ以外 |
| 409 | DOMAIN_CONFLICT | archivedチェックイン等 |
| 500 | INTERNAL_ERROR | 予期せぬ障害 |

## 5. エラー時の挙動・リカバリ
- 409: 画面に業務導線（再開/再読み込み）を提示。
- 500: trace_id付き汎用エラー表示。
- リトライ: GETは最大2回、自動再送。POST/DELETEは自動再送しない。
