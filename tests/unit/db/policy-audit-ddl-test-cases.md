# Policy/Audit DDLテストケース設計（PR-001）

## 1. 目的
- `TBL-006/TBL-007/TBL-008` のDDL仕様（型、制約、index、RLS、監査トリガー）を失敗テスト観点へ分解し、Red判定を固定する。
- 本書は `T-020 / PR-001` の成果物であり、`T-021` でGreen化する実装境界を明確にする。

## 2. 設計トレース
| 仕様ID | 仕様概要 | 参照 |
|---|---|---|
| TBL-006 | `policy_settings` のカラム、constraint、index、更新監査、更新権限制御 | `docs/02_Detailed_Design/06_Data_Design/TBL-006_policy_settings.md` |
| TBL-007 | `policy_consents` のカラム、constraint、unique/index、insert監査、RLS | `docs/02_Detailed_Design/06_Data_Design/TBL-007_policy_consents.md` |
| TBL-008 | `audit_logs` のカラム、constraint、index、metadata要件 | `docs/02_Detailed_Design/06_Data_Design/TBL-008_audit_logs.md` |
| IF-004 | `policy_settings` 更新時の `old_version/new_version` 監査必須 | `docs/02_Detailed_Design/08_Interface_Design/IF-004_policy_settings更新.md` |
| IF-005 | `audit_logs` の抽出・運用前提 | `docs/02_Detailed_Design/08_Interface_Design/IF-005_運用CLI_SQL.md` |
| FNC-013 | 監査必須項目とアクセス制御 | `docs/01_Project_Design/05_Feature_List.md` |

## 3. テスト観測点
- カラム定義: 型、NOT NULL、default、PK/FK。
- constraint: `chk_policy_settings_type`, `chk_policy_consents_type`, `chk_audit_logs_result`, `chk_audit_logs_required`。
- index/unique: `idx_policy_settings_updated`, `uq_policy_consents_user_type_ver`, `idx_policy_consents_user_type_time`, `idx_audit_logs_occurred`, `idx_audit_logs_actor`, `idx_audit_logs_action_result`。
- trigger/audit: `trg_policy_consents_insert_audit`、`policy_settings` 更新時の `audit_logs` 差分記録。
- RLS: `policy_consents` で `auth.uid() = user_id` を強制するポリシー。
- metadata必須: `policy_settings` 更新監査で `metadata_json` に `old_version/new_version/policy_type` を保持。

## 4. テストケース一覧（正常系・異常系・境界）
| TC ID | 区分 | 対象 | 観測点 | 期待結果（Red段階の期待失敗） | トレース |
|---|---|---|---|---|---|
| TC-PA-DDL-001 | 正常系 | policy_settings | `policy_type` PK(varchar(16), not null) | 定義欠落時に失敗（TBL-006不一致） | TBL-006 |
| TC-PA-DDL-002 | 異常系 | policy_settings | `chk_policy_settings_type` | `terms/privacy` 以外を許容していたら失敗 | TBL-006 |
| TC-PA-DDL-003 | 正常系 | policy_settings | `idx_policy_settings_updated` | index未作成時に失敗 | TBL-006 |
| TC-PA-DDL-004 | 異常系 | policy_settings | 更新監査（版差分） | `audit_logs` へ `old_version/new_version` が記録されなければ失敗 | TBL-006/IF-004 |
| TC-PA-DDL-005 | 正常系 | policy_consents | `id` PK / `user_id` FK / `policy_type` FK | PK/FK欠落時に失敗 | TBL-007 |
| TC-PA-DDL-006 | 正常系 | policy_consents | `uq_policy_consents_user_type_ver` | unique欠落時に失敗 | TBL-007 |
| TC-PA-DDL-007 | 正常系 | policy_consents | `idx_policy_consents_user_type_time` | 最新同意判定用index欠落時に失敗 | TBL-007 |
| TC-PA-DDL-008 | 異常系 | policy_consents | `trg_policy_consents_insert_audit` | insert時監査イベントが作成されなければ失敗 | TBL-007/FNC-011 |
| TC-PA-DDL-009 | 異常系 | policy_consents | RLS (`auth.uid() = user_id`) | 他ユーザー参照/更新が拒否されない場合に失敗 | TBL-007/FNC-013 |
| TC-PA-DDL-010 | 正常系 | audit_logs | 必須カラム (`occurred_at/action/target_type/target_id/result/metadata_json`) | 型/NULL/default不一致時に失敗 | TBL-008 |
| TC-PA-DDL-011 | 異常系 | audit_logs | `chk_audit_logs_result` | `success/failure` 以外を許容したら失敗 | TBL-008 |
| TC-PA-DDL-012 | 正常系 | audit_logs | `idx_audit_logs_occurred` / `idx_audit_logs_actor` / `idx_audit_logs_action_result` | index未作成時に失敗 | TBL-008/IF-005 |
| TC-PA-DDL-013 | 境界 | audit_logs | `metadata_json` default `'{}'::jsonb` | default欠落やnull許容時に失敗 | TBL-008 |

## 5. Red判定（失敗条件 / 期待失敗）
- Red判定: `policy-audit-schema-ddl` / `policy-audit-constraints-ddl` / `policy-consents-rls-ddl` / `policy-audit-trigger-ddl` のいずれかが `exit code 1` になること。
- 失敗条件: 次のいずれかが欠落/不一致であれば失敗。
  - 必須カラム定義（型、NULL制約、default、PK/FK）
  - check/unique/index
  - 監査トリガー定義または期待動作
  - RLSポリシー
  - `metadata_json` の必須差分情報（`old_version/new_version/policy_type`）
- 期待失敗メッセージに含める要素:
  - 対象テーブル名（`policy_settings` / `policy_consents` / `audit_logs`）
  - 仕様ID（`TBL-006` / `TBL-007` / `TBL-008`）
  - 欠落要素（例: `uq_policy_consents_user_type_ver`, `trg_policy_consents_insert_audit`, `RLS policy`, `chk_audit_logs_result`）

## 6. T-021でGreen化する対象
- DDL本体: 3テーブルのcreate文、共通カラム、PK/FK、default。
- 制約/index/unique: 設計書記載名のconstraint/indexを実装。
- 監査トリガー: `policy_consents` insert監査と `policy_settings` 更新差分監査を実装。
- RLS: `policy_consents` の有効化 + `auth.uid() = user_id` ポリシー実装。

## 7. 実装への引き継ぎ
- `tests/integration/db/policy-audit-schema-ddl.test.ts`: カラム、型、NULL、default。
- `tests/integration/db/policy-audit-constraints-ddl.test.ts`: check/FK/index/unique。
- `tests/integration/db/policy-consents-rls-ddl.test.ts`: RLS拒否/許可。
- `tests/integration/db/policy-audit-trigger-ddl.test.ts`: 監査トリガー/metadata検証。
