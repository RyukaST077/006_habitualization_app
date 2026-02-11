# M-011 KpiAggregationService

## 1. 概要
BAT-001/BAT-003で日次アクティビティと匿名KPIを集計する。

## 2. パッケージ/配置
- Package: `application/kpi`
- File: `KpiAggregationService.ts`

## 3. 依存関係
- `M-101 UserRepository`
- `M-104 OpsRepository`
- `M-010 AuditLogService`

## 4. 公開メソッド
### 4.1 `runDailyAggregation(targetDate)`
1. user_daily_activity を集計/UPSERT。
2. analytics_daily_kpi を metric_key単位で更新。
3. 集計完了ログを記録。

### 4.2 `calculateThresholds(window)`
- 5xx率/Auth失敗率/P95を評価し、通知イベントを生成。

## 5. 内部構造
```ts
type MetricKey = 'dau'|'daily_checkins'|'retention_7d'|'retention_30d';
```

## 6. エラー
- `KPI_AGGREGATION_FAILED`
