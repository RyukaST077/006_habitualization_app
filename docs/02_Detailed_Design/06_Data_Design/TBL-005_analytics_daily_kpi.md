# analytics_daily_kpi (匿名KPI日次集計)

## 1. 概要
- 目的: KPI（DAU、チェックイン数など）を個人識別子なしで保持。
- トレース: ← [FNC-009](../../01_Project_Design/05_Feature_List.md#L78), ← [RPT-001](../../01_Project_Design/05_Feature_List.md#L110), ← [IF-005](../08_Interface_Design/IF-005_運用CLI_SQL.md)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | KPI ID | bigserial | - | No | Yes | - | - | |
| metric_date | 集計日 | date | - | No | - | - | - | |
| metric_key | 指標キー | varchar | 64 | No | - | - | - | dau/checkins/retention_7d等 |
| metric_value | 指標値 | numeric | 14,2 | No | - | - | 0 | |
| dimension_json | ディメンション | jsonb | - | No | - | - | '{}'::jsonb | 例: {"platform":"web"} |
| dimension_hash | ディメンションハッシュ | varchar | 64 | No | - | - | - | 重複排除用 |
| aggregated_at | 集計日時 | timestamptz | - | No | - | - | now() | |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_analytics_daily_kpi | Primary | id | |
| uq_analytics_daily_kpi_key | Unique | metric_date, metric_key, dimension_hash | 日次ユニーク |
| idx_analytics_daily_kpi_date_key | Normal | metric_date desc, metric_key | RPT-001出力 |

## 4. 制約・トリガー
- `chk_analytics_daily_kpi_non_negative`: `metric_value >= 0`（率系除く）。
- `trg_analytics_daily_kpi_upsert`: BAT-001/BAT-003からUPSERT。
- 参照権限: ROLE-002（運用者）/service roleのみ。

## 5. 備考
- 個人識別子（user_id, email等）は格納しない。
