# M-104 OpsRepository

## 1. 概要
`audit_logs`、`analytics_daily_kpi`、`account_deletion_jobs`、`monitoring_alert_events` を操作するRepository。

## 2. パッケージ/配置
- Package: `infrastructure/repositories`
- File: `OpsRepository.ts`

## 3. 依存関係
- `SupabaseClient`

## 4. 公開メソッド/関数定義
### 4.1 `insertAuditLog(record)`
- 監査ログ登録。

### 4.2 `upsertDailyKpi(rows)`
- 日次KPI UPSERT。

### 4.3 `createDeletionJob(job)` / `updateDeletionJobStatus(jobId, status)`
- 退会ジョブ管理。

### 4.4 `listPendingDeletionJobs(now)`
- 期限到達ジョブ抽出。

### 4.5 `insertMonitoringAlertEvent(event)` / `markAlertDispatched(id, result)`
- 通知イベント管理。

### 4.6 `queryKpiForReport(filter)` / `queryAuditLogsForReport(filter)`
- RPT-001/RPT-002抽出。

## 5. 内部構造
```ts
type DeletionJobStatus = 'queued'|'in_progress'|'completed'|'failed';
```

## 6. エラーハンドリング
- `AUDIT_INSERT_FAILED`
- `KPI_UPSERT_FAILED`
- `DELETION_JOB_FAILED`
- `ALERT_EVENT_FAILED`
