# habit_logs (習慣ログ)

## 1. 概要
- 目的: 日次チェックインの記録と取消制御を管理。
- トレース: ← [FNC-005](../../01_Project_Design/05_Feature_List.md#L74), ← [FNC-006](../../01_Project_Design/05_Feature_List.md#L75), ← [FNC-007](../../01_Project_Design/05_Feature_List.md#L76)
- 関連画面: → [SCR-002_ホーム（習慣一覧）](../07_Screen_Design/SCR-002_ホーム（習慣一覧）.md)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | ログID | bigserial | - | No | Yes | - | - | |
| user_id | ユーザーID | uuid | - | No | - | profiles.user_id | - | |
| habit_id | 習慣ID | bigint | - | No | - | habits.id | - | |
| log_date | 業務日付 | date | - | No | - | - | - | TZ+締め時刻で算出 |
| checked_in_at | チェックイン日時 | timestamptz | - | No | - | - | now() | |
| source | 登録元 | varchar | 16 | No | - | - | 'manual' | manual/system |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |
| updated_at | 更新日時 | timestamptz | - | No | - | - | now() | |
| deleted_at | 削除日時 | timestamptz | - | Yes | - | - | - | 取消時は物理削除 |
| version | バージョン | integer | - | No | - | - | 1 | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_habit_logs | Primary | id | |
| uq_habit_logs_habit_date | Unique | habit_id, log_date | `FR-012` 冪等担保 |
| idx_habit_logs_user_date | Normal | user_id, log_date desc | 履歴表示 |
| idx_habit_logs_habit_date | Normal | habit_id, log_date desc | ストリーク計算 |

## 4. 制約・トリガー
- `fk_habit_logs_habit`: habitsとの参照整合。
- `trg_habit_logs_validate_active`: insert時に対象habitが`active`でない場合はエラー（409）。
- `trg_habit_logs_updated_at`: 更新時刻更新。
- RLS: `auth.uid() = user_id`。

## 5. 備考
- 取消 (`FR-014`) は `log_date` 当日分のみDELETE可。
- archived習慣への登録は `EX-012` で拒否。
