# M-003 HabitService

## 1. 概要
習慣作成、更新、アーカイブ、再開を提供する。

## 2. パッケージ/配置
- Package: `application/habit`
- File: `HabitService.ts`

## 3. 依存関係
- `M-102 HabitRepository`
- `M-014 AuthorizationPolicyService`
- `M-010 AuditLogService`

## 4. 公開メソッド
### 4.1 `createHabit(userId, name, displayOrder)`
1. 入力検証（1〜80文字、順序範囲）。
2. repositoryでinsert。
3. 監査ログ `HABIT_CREATE`。

### 4.2 `updateHabit(userId, habitId, payload)`
- 本人所有チェック後、更新。

### 4.3 `archiveHabit(userId, habitId)` / `resumeHabit(userId, habitId)`
- 状態遷移を強制し、監査記録。

## 5. 内部構造
```ts
interface HabitUpdateInput { name?: string; displayOrder?: number }
```

## 6. エラー
- `FORBIDDEN`（他人データ）
- `INVALID_HABIT_INPUT`
