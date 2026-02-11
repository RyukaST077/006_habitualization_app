# habits (習慣)

## 1. 概要
- 目的: 習慣の作成/更新/アーカイブ/再開を管理。
- トレース: ← [FNC-004](../../01_Project_Design/05_Feature_List.md#L73), ← [FNC-006](../../01_Project_Design/05_Feature_List.md#L75), ← [FNC-008](../../01_Project_Design/05_Feature_List.md#L77)
- 関連画面: → [SCR-003_習慣作成](../07_Screen_Design/SCR-003_習慣作成.md), → [SCR-004_習慣編集](../07_Screen_Design/SCR-004_習慣編集.md)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | 習慣ID | bigserial | - | No | Yes | - | - | |
| user_id | ユーザーID | uuid | - | No | - | profiles.user_id | - | |
| name | 習慣名 | varchar | 80 | No | - | - | - | 重複許可 |
| display_order | 表示順 | integer | - | No | - | - | 100 | 昇順表示 |
| status | 状態 | varchar | 16 | No | - | - | 'active' | active/archived |
| archived_at | アーカイブ日時 | timestamptz | - | Yes | - | - | - | |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |
| updated_at | 更新日時 | timestamptz | - | No | - | - | now() | |
| deleted_at | 削除日時 | timestamptz | - | Yes | - | - | - | |
| version | バージョン | integer | - | No | - | - | 1 | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_habits | Primary | id | |
| idx_habits_user_status_order | Normal | user_id, status, display_order | ホーム表示最適化 |
| idx_habits_user_updated | Normal | user_id, updated_at desc | |

## 4. 制約・トリガー
- `chk_habits_status`: `status in ('active','archived')`。
- `chk_habits_name_len`: 1〜80文字。
- `trg_habits_archive`: `status='archived'` へ更新時に `archived_at=now()`。
- RLS: `auth.uid() = user_id` のみ操作可。

## 5. 備考
- `FR-016`: ホーム表示は `status='active'` のみ。
- `FR-017`: 履歴画面は既定で archived 非表示、切替時のみ表示。
