# monitoring_alert_events (監視通知イベント)

## 1. 概要
- 目的: 閾値判定結果と通知送信結果を記録する。
- トレース: ← [FNC-009](../../01_Project_Design/05_Feature_List.md#L78), ← [IF-003](../08_Interface_Design/IF-003_監視通知メール.md), ← [AC-018](../../01_Project_Design/01_Requirements.md#L208)

## 2. テーブル定義
| カラム名 | 論理名 | 型 | 長さ/精度 | NULL | PK | FK | Default | 備考 |
| -- | -- | -- | -- | -- | -- | -- | -- | -- |
| id | イベントID | bigserial | - | No | Yes | - | - | |
| alert_level | 通知レベル | varchar | 8 | No | - | - | - | P1/P2 |
| alert_type | 閾値種別 | varchar | 32 | No | - | - | - | five_xx_rate/auth_fail_rate/p95_latency |
| threshold_rule | 閾値条件 | varchar | 128 | No | - | - | - | |
| observed_value | 観測値 | numeric | 10,4 | No | - | - | - | |
| window_start_at | 集計開始 | timestamptz | - | No | - | - | - | |
| window_end_at | 集計終了 | timestamptz | - | No | - | - | - | |
| notification_target | 通知先 | varchar | 255 | No | - | - | - | 単一通知先 |
| notification_status | 通知状態 | varchar | 16 | No | - | - | 'pending' | pending/sent/failed |
| notified_at | 通知日時 | timestamptz | - | Yes | - | - | - | |
| error_message | エラー内容 | text | - | Yes | - | - | - | |
| created_at | 作成日時 | timestamptz | - | No | - | - | now() | |

## 3. インデックス定義
| インデックス名 | 種類 | 対象カラム | 備考 |
| -- | -- | -- | -- |
| pk_monitoring_alert_events | Primary | id | |
| idx_monitoring_alert_events_status | Normal | notification_status, created_at desc | 再送制御 |
| idx_monitoring_alert_events_level_time | Normal | alert_level, created_at desc | 運用確認 |

## 4. 制約・トリガー
- `chk_monitoring_alert_events_level`: `alert_level in ('P1','P2')`。
- `chk_monitoring_alert_events_status`: `notification_status in ('pending','sent','failed')`。
- P2通知は既定無効（設定で有効化時のみinsert）。

## 5. 備考
- IF-003の実装基盤は別途確定するが、通知イベント監査は本テーブルで統一する。
