# Core DDLテストケース設計（PR-001）

## 1. 目的
- `TBL-001/TBL-002/TBL-003` のDDL仕様（型、制約、Index、Unique、Trigger、RLS）を失敗テスト観点へ分解し、Red判定を固定する。
- 本書は `T-018 / PR-001` の成果物であり、`T-019` でGreen化する実装境界を明確にする。

## 2. 設計トレース
| 仕様ID | 仕様概要 | 参照 |
|---|---|---|
| TBL-001 | `profiles` のカラム、制約、Index、Trigger、RLS | `docs/02_Detailed_Design/06_Data_Design/TBL-001_profiles.md` |
| TBL-002 | `habits` のカラム、制約、Index、Trigger、RLS | `docs/02_Detailed_Design/06_Data_Design/TBL-002_habits.md` |
| TBL-003 | `habit_logs` のカラム、制約、Index、Unique、Trigger、RLS | `docs/02_Detailed_Design/06_Data_Design/TBL-003_habit_logs.md` |
| SEC-CON-001 | RLS必須、最小権限 | `docs/01_Project_Design/10_Security_Design.md` |

## 3. テスト観測点
- カラム定義: 型、NOT NULL、Default、PK/FK。
- 制約: `chk_profiles_cutoff`, `chk_habits_status`, `chk_habits_name_len`, `fk_habit_logs_habit`。
- Index/Unique: `idx_*`, `uq_habit_logs_habit_date`。
- Trigger: `trg_profiles_updated_at`, `trg_habits_archive`, `trg_habit_logs_validate_active`, `trg_habit_logs_updated_at`。
- RLS: 3テーブルすべてで `auth.uid() = user_id` を強制するポリシー。

## 4. テストケース一覧（正常系・異常系・境界）
| TC ID | 区分 | 対象 | 観測点 | 期待結果（Red段階の期待失敗） | トレース |
|---|---|---|---|---|---|
| TC-DDL-001 | 正常系 | profiles | `user_id` が PK(uuid, not null) | 定義欠落時に失敗（TBL-001不一致） | TBL-001 |
| TC-DDL-002 | 異常系 | profiles | `day_cutoff_time` 制約 | `00:00:00`〜`23:59:00` 以外許容時に失敗 | TBL-001 |
| TC-DDL-003 | 正常系 | profiles | `idx_profiles_status`, `idx_profiles_updated_at` | Index未作成時に失敗 | TBL-001 |
| TC-DDL-004 | 異常系 | profiles | `trg_profiles_updated_at` | Trigger未作成/動作不一致時に失敗 | TBL-001 |
| TC-DDL-005 | 正常系 | habits | `status` default/check | `active/archived` 制約欠落時に失敗 | TBL-002 |
| TC-DDL-006 | 正常系 | habits | 複合Index `idx_habits_user_status_order` | Index未作成時に失敗 | TBL-002 |
| TC-DDL-007 | 異常系 | habits | `trg_habits_archive` | archived遷移で `archived_at` 未更新なら失敗 | TBL-002 |
| TC-DDL-008 | 正常系 | habit_logs | `uq_habit_logs_habit_date` | Unique欠落時に失敗 | TBL-003 |
| TC-DDL-009 | 正常系 | habit_logs | `fk_habit_logs_habit` | FK欠落時に失敗 | TBL-003 |
| TC-DDL-010 | 異常系 | habit_logs | `trg_habit_logs_validate_active` | archived習慣へのinsert拒否が無ければ失敗 | TBL-003 |
| TC-DDL-011 | 境界 | habit_logs | `source` default/manual-system, `checked_in_at` default | default不一致時に失敗 | TBL-003 |
| TC-DDL-012 | 異常系 | 全テーブル | RLS (`auth.uid() = user_id`) | 他ユーザー参照/更新が拒否されない場合に失敗 | TBL-001/TBL-002/TBL-003 |

## 5. Red判定（失敗条件 / 期待失敗）
- Red判定: `core-schema-ddl` / `core-constraints-ddl` / `core-rls-ddl` のいずれかが `exit code 1` になること。
- 失敗条件: 次のいずれかが欠落/不一致であれば失敗。
  - 必須カラム定義（型、NULL制約、Default）
  - check/FK/Unique/Index
  - Trigger定義または期待動作
  - RLSポリシー
- 期待失敗メッセージに含める要素:
  - 対象テーブル名（`profiles` / `habits` / `habit_logs`）
  - 仕様ID（`TBL-001` / `TBL-002` / `TBL-003`）
  - 欠落要素（例: `uq_habit_logs_habit_date`, `trg_habits_archive`, `RLS policy`）

## 6. T-019でGreen化する対象
- DDL本体: 3テーブルのcreate文、共通カラム、PK/FK、default。
- 制約/Index/Unique: 仕様書記載名の制約・Indexを実装。
- Trigger: 4種のTrigger関数と紐づけを実装。
- RLS: 3テーブルの有効化 + `auth.uid() = user_id` ポリシー実装。

## 7. 実装への引き継ぎ
- `tests/integration/db/core-schema-ddl.test.ts`: カラム、型、NULL、default。
- `tests/integration/db/core-constraints-ddl.test.ts`: check/FK/Index/Unique。
- `tests/integration/db/core-rls-ddl.test.ts`: RLS拒否/許可。
- `tests/integration/db/core-trigger-ddl.test.ts`: Trigger検証。
