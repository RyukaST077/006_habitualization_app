# audit_logs (監査ログ)

## 1. 概要
- 目的: 監査対象操作の必須項目を記録する。
- トレース: ← [FNC-011](../../01_Project_Design/05_Feature_List.md#L80), ← [FNC-013](../../01_Project_Design/05_Feature_List.md#L82), ← [FR-026](../../01_Project_Design/01_Requirements.md#L165)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | 監査ID | bigserial | - | No | Yes | - | - | |
| occurred_at | 発生日時 | timestamptz | - | No | - | - | now() | 必須 |
| actor_user_id | 操作者ユーザーID | uuid | - | Yes | - | (profiles.user_id) | - | システム処理はNULL可 |
| actor_role | 操作者ロール | varchar | 32 | No | - | - | - | ROLE-001/ROLE-002/system |
| action | 操作種別 | varchar | 64 | No | - | - | - | 必須 |
| target_type | 対象種別 | varchar | 64 | No | - | - | - | 必須 |
| target_id | 対象ID | varchar | 128 | No | - | - | - | 必須 |
| result | 結果 | varchar | 16 | No | - | - | - | success/failure |
| reason | 理由 | text | - | Yes | - | - | - | エラー理由 |
| requirement_id | 要件ID | varchar | 16 | Yes | - | - | - | FR-xxx |
| trace_id | トレースID | uuid | - | Yes | - | - | - | API相関 |
| metadata_json | 補足情報 | jsonb | - | No | - | - | '{}'::jsonb | policy差分等 |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_audit_logs | Primary | id | |
| idx_audit_logs_occurred | Normal | occurred_at desc | 期間検索 |
| idx_audit_logs_actor | Normal | actor_user_id, occurred_at desc | |
| idx_audit_logs_action_result | Normal | action, result, occurred_at desc | RPT-002 |

## 4. 制約・トリガー
- `chk_audit_logs_result`: `result in ('success','failure')`。
- `chk_audit_logs_required`: action/target_type/target_id 非NULL。
- 保持ポリシー: 90日超過で物理削除（BAT-003内の保守ジョブ）。

## 5. 備考
- `policy_settings` 更新時は `metadata_json` に `old_version/new_version/policy_type` を必須格納。
