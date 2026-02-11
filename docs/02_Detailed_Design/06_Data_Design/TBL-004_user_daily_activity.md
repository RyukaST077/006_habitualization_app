# user_daily_activity (ユーザー日次活動集計)

## 1. 概要
- 目的: ユーザー単位の日次集計（チェックイン回数、ログイン有無）を保持。
- トレース: ← [FNC-008](../../01_Project_Design/05_Feature_List.md#L77), ← [FNC-009](../../01_Project_Design/05_Feature_List.md#L78), ← [BAT-001](../../01_Project_Design/05_Feature_List.md#L152)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | 集計ID | bigserial | - | No | Yes | - | - | |
| user_id | ユーザーID | uuid | - | No | - | profiles.user_id | - | |
| activity_date | 活動日 | date | - | No | - | - | - | |
| login_count | ログイン回数 | integer | - | No | - | - | 0 | |
| checkin_count | チェックイン回数 | integer | - | No | - | - | 0 | |
| timezone_snapshot | TZスナップショット | varchar | 64 | No | - | - | 'Asia/Tokyo' | |
| cutoff_snapshot | 締め時刻スナップショット | time | - | No | - | - | '03:00:00' | |
| aggregated_at | 集計日時 | timestamptz | - | No | - | - | now() | |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |
| updated_at | 更新日時 | timestamptz | - | No | - | - | now() | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_user_daily_activity | Primary | id | |
| uq_user_daily_activity_user_date | Unique | user_id, activity_date | 日次1レコード |
| idx_user_daily_activity_date | Normal | activity_date desc | BAT-001 |

## 4. 制約・トリガー
- `chk_user_daily_activity_counts`: `login_count >= 0 and checkin_count >= 0`。
- `trg_user_daily_activity_upsert`: BAT-001でUPSERT。
- RLS: 個人データのため `auth.uid() = user_id`（クライアント直接参照は原則なし）。

## 5. 備考
- 内部集計テーブル（SC-004）として扱い、画面直接表示はしない。
