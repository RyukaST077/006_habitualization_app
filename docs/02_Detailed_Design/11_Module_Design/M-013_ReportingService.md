# M-013 ReportingService

## 1. 概要
RPT-001/RPT-002向けにSQL抽出結果をCSV化する。

## 2. パッケージ/配置
- Package: `application/reporting`
- File: `ReportingService.ts`

## 3. 依存関係
- `M-104 OpsRepository`

## 4. 公開メソッド
### 4.1 `exportDailyKpiCsv(fromDate, toDate)`
- analytics_daily_kpi を抽出しCSV返却。

### 4.2 `exportAuditLogCsv(filter)`
- audit_logs を条件抽出しCSV返却。

## 5. 内部構造
```ts
type AuditFilter = { from: string; to: string; action?: string; result?: string };
```

## 6. エラー
- `REPORT_EXPORT_FAILED`
