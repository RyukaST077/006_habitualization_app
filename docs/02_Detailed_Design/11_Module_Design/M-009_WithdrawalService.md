# M-009 WithdrawalService

## 1. 概要
退会要求を受け、60秒不可化 + 5分完全削除ジョブ起票を行う。

## 2. パッケージ/配置
- Package: `application/withdrawal`
- File: `WithdrawalService.ts`

## 3. 依存関係
- `M-101 UserRepository`
- `M-104 OpsRepository`
- `M-010 AuditLogService`

## 4. 公開メソッド
### 4.1 `requestWithdrawal(userId, requestedAt)`
1. profiles.account_status を `disabled` へ更新。
2. account_deletion_jobs を `queued` で作成。
3. 監査ログ記録。
4. 呼び出し元へログアウト指示。

### 4.2 `runHardDeleteJob(jobId)`
1. 退会対象データ削除（profiles/habits/habit_logs/policy_consents/user_daily_activity/auth.users）。
2. ジョブ完了更新。
3. 失敗時は retry_count 更新。

## 5. 内部構造
```ts
type WithdrawalResult = { disabledAt: string; hardDeleteDueAt: string };
```

## 6. エラー
- `WITHDRAWAL_ALREADY_REQUESTED`
- `HARD_DELETE_FAILED`
