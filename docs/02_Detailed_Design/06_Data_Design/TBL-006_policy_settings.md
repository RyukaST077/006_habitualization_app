# policy_settings (ポリシー設定)

## 1. 概要
- 目的: 利用規約/プライバシーポリシーの最新版を管理。
- トレース: ← [FNC-002](../../01_Project_Design/05_Feature_List.md#L71), ← [IF-004](../08_Interface_Design/IF-004_policy_settings更新.md)
- 関連画面: → [SCR-008_ポリシー同意](../07_Screen_Design/SCR-008_ポリシー同意.md)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| policy_type | ポリシー種別 | varchar | 16 | No | Yes | - | - | terms/privacy |
| current_version | 現在版 | varchar | 20 | No | - | - | - | |
| effective_from | 適用開始日時 | timestamptz | - | No | - | - | now() | |
| document_url | 文書URL | varchar | 255 | No | - | - | - | |
| updated_by | 更新者 | uuid | - | Yes | - | - | - | actor |
| updated_at | 更新日時 | timestamptz | - | No | - | - | now() | |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_policy_settings | Primary | policy_type | |
| idx_policy_settings_updated | Normal | updated_at desc | |

## 4. 制約・トリガー
- `chk_policy_settings_type`: `policy_type in ('terms','privacy')`。
- 更新権限制御: service roleのみUPDATE許可。
- 更新監査: 更新時に `audit_logs` へ版差分記録（FR-026）。

## 5. 備考
- 初期投入必須テーブル。
