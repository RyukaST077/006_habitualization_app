# M-005 CheckinService

## 1. 概要
当日チェックイン登録、重複冪等、当日取消を管理する。

## 2. パッケージ/配置
- Package: `application/checkin`
- File: `CheckinService.ts`

## 3. 依存関係
- `M-004 BusinessDateService`
- `M-102 HabitRepository`
- `M-101 UserRepository`
- `M-010 AuditLogService`

## 4. 公開メソッド
### 4.1 `registerCheckin(userId, habitId, nowUtc)`
1. habit所有者とstatus確認（active必須）。
2. log_date算出。
3. `habit_logs` をUPSERT（`habit_id+log_date` 一意）。
4. `user_daily_activity` 更新。
5. 結果（idempotent true/false）返却。

### 4.2 `cancelTodayCheckin(userId, habitId, nowUtc)`
1. 当日 `log_date` 算出。
2. 対象日レコードのみDELETE。
3. 監査ログ記録。

## 5. 内部構造
```ts
type CheckinResult = { logDate: string; idempotent: boolean };
```

## 6. エラー
- `HABIT_ARCHIVED`
- `CHECKIN_CANCEL_NOT_ALLOWED`
- `FORBIDDEN`
