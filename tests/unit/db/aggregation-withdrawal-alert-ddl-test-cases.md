# 集計/退会/通知DDLテスト観点（PR-001）

## 1. 目的
- `TBL-004` / `TBL-005` / `TBL-009` / `TBL-010` のDDL要件を失敗テスト観点として固定し、`T-023` でGreen化する実装範囲を明確化する。
- 本ドキュメントは Red フェーズ用の期待失敗仕様であり、現時点では未実装DDLを検知することを前提とする。

## 2. 対象テーブルとDDL観点

### 2.1 TBL-004 `user_daily_activity`
- カラム/型/default
  - `user_id uuid not null`（個人データ）
  - `activity_date date not null`
  - `login_count integer not null default 0`
  - `checkin_count integer not null default 0`
  - `timezone_snapshot varchar(64) not null default 'Asia/Tokyo'`
  - `cutoff_snapshot time not null default '03:00:00'`
- constraint
  - `chk_user_daily_activity_counts`（`login_count >= 0 and checkin_count >= 0`）
  - `uq_user_daily_activity_user_date`（`user_id, activity_date`）
- index
  - `idx_user_daily_activity_date`（`activity_date desc`）
- RLS
  - `auth.uid() = user_id` を満たすポリシー（クライアント直接参照を許可しない）

### 2.2 TBL-005 `analytics_daily_kpi`
- カラム/型/default
  - `metric_date date not null`
  - `metric_key varchar(64) not null`
  - `metric_value numeric(14,2) not null default 0`
  - `dimension_json jsonb not null default '{}'::jsonb`
  - `dimension_hash varchar(64) not null`
- constraint
  - `chk_analytics_daily_kpi_non_negative`（`metric_value >= 0`）
  - `uq_analytics_daily_kpi_key`（`metric_date, metric_key, dimension_hash`）
- index
  - `idx_analytics_daily_kpi_date_key`（`metric_date desc, metric_key`）
- 権限制御
  - ROLE-002 / service role のみ参照（匿名KPIで個人識別子を持たない）

### 2.3 TBL-009 `account_deletion_jobs`
- カラム/型/default（SLA含む）
  - `job_status varchar(16) not null default 'queued'`
  - `disable_due_at timestamptz not null default now()+interval '60 second'`
  - `hard_delete_due_at timestamptz not null default now()+interval '5 minute'`
  - `retry_count smallint not null default 0`
- constraint
  - `chk_account_deletion_jobs_status`（`queued/in_progress/completed/failed`）
  - `uq_account_deletion_jobs_user`（ユーザーごとにジョブ一意）
- index
  - `idx_account_deletion_jobs_status_due`（`job_status, hard_delete_due_at`）
- ジョブ状態遷移
  - `queued -> in_progress -> completed | failed` 以外は不正として扱う

### 2.4 TBL-010 `monitoring_alert_events`
- カラム/型/default
  - `alert_level varchar(8) not null`（`P1/P2`）
  - `notification_status varchar(16) not null default 'pending'`
  - `error_message text null`
- constraint
  - `chk_monitoring_alert_events_level`（`alert_level in ('P1','P2')`）
  - `chk_monitoring_alert_events_status`（`notification_status in ('pending','sent','failed')`）
- index
  - `idx_monitoring_alert_events_status`（`notification_status, created_at desc`）
  - `idx_monitoring_alert_events_level_time`（`alert_level, created_at desc`）
- 通知運用
  - P2は既定無効（設定有効化時のみinsert想定）

## 3. テストケース方針（正常/異常/境界）
- 正常
  - 各テーブルで required カラム・default・unique/index 名称が設計通りであることを確認する。
- 異常
  - check constraint 不在時に不正値（負数、未定義状態）が通ってしまうことを期待失敗として検知する。
  - unique/index 不在時に重複登録や探索劣化リスクを期待失敗として検知する。
  - RLS/権限制御が未定義の場合にアクセス制御違反を期待失敗として検知する。
- 境界
  - 状態列は許可列挙値の境界（許可値/非許可値）を網羅する。
  - `disable_due_at` 60秒、`hard_delete_due_at` 5分のSLA定義をDDL default式として検証する。

## 4. Red判定（失敗条件）
- Red判定
  - 対象DDL（カラム定義・constraint・index・RLS・権限制御）のいずれかが欠落している場合、テストは失敗する。
- 失敗条件
  - 設計書に記載された constraint 名が一致しない、または存在しない。
  - 期待indexが存在しない、または対象列が一致しない。
  - RLS policy または ROLE-002/service role 制御が確認できない。
  - ジョブ状態遷移・通知状態遷移の制約を満たせない。
- 期待失敗メッセージ方針
  - 失敗文には `TBL-004` / `TBL-005` / `TBL-009` / `TBL-010` の識別子と未実装DDL名を必ず含める。

## 5. T-023でGreen化すべき範囲
- DDL本体
  - 4テーブルの `create table` と required カラム/型/default/nullability。
- 制約
  - check/unique/FK（必要箇所）を設計名で実装する。
- index
  - 設計書記載の運用・抽出用indexを作成する。
- RLS/権限制御
  - `user_daily_activity` の `auth.uid() = user_id`。
  - `analytics_daily_kpi` の ROLE-002/service role 制御。
- トリガー/状態遷移
  - 更新時刻更新、UPSERT、ジョブ遷移/通知状態制約に必要なDDL要素を実装する。
