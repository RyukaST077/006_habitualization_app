# account_deletion_jobs (退会削除ジョブ)

## 1. 概要
- 目的: 二段階削除（不可化/完全削除）の進捗を管理。
- トレース: ← [FNC-012](../../01_Project_Design/05_Feature_List.md#L81), ← [BAT-004](../../01_Project_Design/05_Feature_List.md#L156)
- 関連画面: → [SCR-007_設定](../07_Screen_Design/SCR-007_設定.md)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | ジョブID | bigserial | - | No | Yes | - | - | |
| user_id | 対象ユーザーID | uuid | - | No | - | profiles.user_id | - | |
| job_status | ジョブ状態 | varchar | 16 | No | - | - | 'queued' | queued/in_progress/completed/failed |
| requested_at | 退会要求日時 | timestamptz | - | No | - | - | now() | |
| disable_due_at | 不可化期限 | timestamptz | - | No | - | - | now()+interval '60 second' | |
| disabled_at | 不可化完了日時 | timestamptz | - | Yes | - | - | - | |
| hard_delete_due_at | 完全削除期限 | timestamptz | - | No | - | - | now()+interval '5 minute' | |
| hard_deleted_at | 完全削除完了日時 | timestamptz | - | Yes | - | - | - | |
| retry_count | リトライ回数 | smallint | - | No | - | - | 0 | |
| last_error | 最終エラー | text | - | Yes | - | - | - | |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |
| updated_at | 更新日時 | timestamptz | - | No | - | - | now() | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_account_deletion_jobs | Primary | id | |
| uq_account_deletion_jobs_user | Unique | user_id | 多重退会防止 |
| idx_account_deletion_jobs_status_due | Normal | job_status, hard_delete_due_at | BAT-004対象抽出 |

## 4. 制約・トリガー
- `chk_account_deletion_jobs_status`: 状態値を制限。
- `trg_account_deletion_jobs_updated_at`: 更新時刻更新。
- ジョブ遷移: queued -> in_progress -> completed / failed。

## 5. 備考
- `FR-023` のSLA判定は本テーブルを監査証跡として利用する。
