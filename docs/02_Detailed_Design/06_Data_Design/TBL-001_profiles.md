# profiles (ユーザープロフィール)

## 1. 概要
- 目的: ユーザー設定（TZ/締め時刻）と退会状態を管理する。
- トレース: ← [FNC-005](../../01_Project_Design/05_Feature_List.md#L74), ← [FNC-010](../../01_Project_Design/05_Feature_List.md#L79), ← [FNC-012](../../01_Project_Design/05_Feature_List.md#L81)
- 関連画面: → [SCR-007_設定](../07_Screen_Design/SCR-007_設定.md)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| user_id | ユーザーID | uuid | - | No | Yes | (auth.users.id) | - | 論理FK |
| timezone | タイムゾーン | varchar | 64 | No | - | - | 'Asia/Tokyo' | IANA形式 |
| day_cutoff_time | 締め時刻 | time | - | No | - | - | '03:00:00' | HH:mm入力 |
| account_status | アカウント状態 | varchar | 16 | No | - | - | 'active' | active/disabled/deleted |
| withdrawal_requested_at | 退会要求日時 | timestamptz | - | Yes | - | - | - | |
| withdrawal_disabled_at | 利用不可化日時 | timestamptz | - | Yes | - | - | - | 60秒以内目標 |
| withdrawal_completed_at | 完全削除完了日時 | timestamptz | - | Yes | - | - | - | 5分以内目標 |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | 共通 |
| updated_at | 更新日時 | timestamptz | - | No | - | - | now() | 共通 |
| deleted_at | 削除日時 | timestamptz | - | Yes | - | - | - | |
| version | バージョン | integer | - | No | - | - | 1 | 楽観ロック |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_profiles | Primary | user_id | |
| idx_profiles_status | Normal | account_status | 退会対象抽出 |
| idx_profiles_updated_at | Normal | updated_at | |

## 4. 制約・トリガー
- `chk_profiles_timezone`: timezone はIANA候補（APIで検証、DBはNOT NULLで担保）。
- `chk_profiles_cutoff`: `day_cutoff_time` は `00:00:00`〜`23:59:00`。
- `trg_profiles_updated_at`: 更新時に `updated_at=now()`。
- RLS: `auth.uid() = user_id` のみSELECT/UPDATE可能。

## 5. 備考
- `FR-020` により締め時刻変更は「変更以降」のみ適用。過去再計算しない。
- 退会時は `account_status='disabled'` を先に反映し、BAT-004で完全削除する。
- `chk_profiles_cutoff` は `day_cutoff_time` の範囲制約。
- `day_cutoff_time` の下限は `00:00:00`（含む）。
- `day_cutoff_time` の上限は `23:59:00`（含む）。
