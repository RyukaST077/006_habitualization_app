# M-010 AuditLogService

## 1. 概要
監査ログ必須項目を統一フォーマットで記録する。

## 2. パッケージ/配置
- Package: `application/audit`
- File: `AuditLogService.ts`

## 3. 依存関係
- `M-104 OpsRepository`

## 4. 公開メソッド
### 4.1 `record(input: AuditRecordInput)`
- 必須: user_id(任意), occurred_at, action, target_id, result。
- policy_settings更新時は old/new version をmetadataへ必須格納。

## 5. 内部構造
```ts
interface AuditRecordInput {
  actorUserId?: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  result: 'success'|'failure';
  requirementId?: string;
  metadata?: Record<string, unknown>;
}
```

## 6. エラー
- `AUDIT_LOG_WRITE_FAILED`
