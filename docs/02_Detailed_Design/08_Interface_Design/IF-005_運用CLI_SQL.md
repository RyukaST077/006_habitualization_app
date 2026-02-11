# IF-005 運用CLI/SQL

## 1. 概要
- 目的: 運用者が匿名KPI確認、監査ログ抽出、退会削除追跡を行う。
- トレース: ← [FNC-009](../../01_Project_Design/05_Feature_List.md#L78), ← [FNC-011](../../01_Project_Design/05_Feature_List.md#L80), ← [FNC-012](../../01_Project_Design/05_Feature_List.md#L81), ← [RPT-001](../../01_Project_Design/05_Feature_List.md#L110), ← [RPT-002](../../01_Project_Design/05_Feature_List.md#L111)

## 2. 接続情報
- 接続先: Supabase SQL Editor / Supabase CLI。
- 実行主体: ROLE-002。
- 認証情報: 管理者トークン（Secrets管理）。
- 運用方式: 手動実行のみ（MVPでは定時自動実行なし）。
- SQLテンプレート正本: 本ファイル（`IF-005_運用CLI_SQL.md`）。

## 3. リクエスト仕様（SQLテンプレート）
### RPT-001 匿名KPI日次CSV
```sql
select
  metric_date,
  metric_key,
  metric_value,
  dimension_json
from analytics_daily_kpi
where metric_date between :from_date and :to_date
order by metric_date desc, metric_key;
```

### RPT-002 監査ログ抽出
```sql
select
  occurred_at,
  actor_user_id,
  actor_role,
  action,
  target_type,
  target_id,
  result,
  requirement_id
from audit_logs
where occurred_at between :from_ts and :to_ts
  and (:action is null or action = :action)
  and (:result is null or result = :result)
order by occurred_at desc;
```

### 退会削除追跡
```sql
select
  user_id,
  job_status,
  requested_at,
  disabled_at,
  hard_deleted_at,
  last_error
from account_deletion_jobs
where requested_at >= now() - interval '7 days'
order by requested_at desc;
```

## 4. レスポンス仕様
- 形式: CSV（UTF-8）。
- 出力先: ダウンロード（ローカル保存）。
- 保持期間: 90日。

## 5. エラー時の挙動・リカバリ
- SQL実行失敗時はクエリ修正後に再実行。
- 抽出結果0件は正常系（空CSV）。
- 実行ログは運用手順書に記録。

## 6. 実装確定が必要な項目
- なし（MVP範囲で確定）。
