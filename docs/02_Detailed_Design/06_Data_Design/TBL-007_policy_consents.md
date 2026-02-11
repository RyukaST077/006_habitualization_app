# policy_consents (同意履歴)

## 1. 概要
- 目的: policy_type単位の同意履歴を記録し、再同意判定の根拠とする。
- トレース: ← [FNC-002](../../01_Project_Design/05_Feature_List.md#L71), ← [FNC-003](../../01_Project_Design/05_Feature_List.md#L72), ← [CON-006](../../01_Project_Design/01_Requirements.md#L259)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | 同意ID | bigserial | - | No | Yes | - | - | |
| user_id | ユーザーID | uuid | - | No | - | profiles.user_id | - | |
| policy_type | ポリシー種別 | varchar | 16 | No | - | policy_settings.policy_type | - | terms/privacy |
| policy_version | 同意版 | varchar | 20 | No | - | - | - | |
| consented_at | 同意日時 | timestamptz | - | No | - | - | now() | |
| consent_source | 同意元 | varchar | 16 | No | - | - | 'web' | |
| user_agent | UA | text | - | Yes | - | - | - | 任意 |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_policy_consents | Primary | id | |
| uq_policy_consents_user_type_ver | Unique | user_id, policy_type, policy_version | FR-005/CON-006 |
| idx_policy_consents_user_type_time | Normal | user_id, policy_type, consented_at desc | 最新同意判定 |

## 4. 制約・トリガー
- `chk_policy_consents_type`: `policy_type in ('terms','privacy')`。
- `trg_policy_consents_insert_audit`: insert時に監査ログ出力。
- RLS: `auth.uid() = user_id`。

## 5. 備考
- 同意拒否はレコード作成しない（セッション破棄イベントを監査ログへ記録）。
