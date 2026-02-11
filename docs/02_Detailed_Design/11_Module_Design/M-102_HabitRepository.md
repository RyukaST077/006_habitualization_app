# M-102 HabitRepository

## 1. 概要
`habits` と `habit_logs` を操作するRepository。

## 2. パッケージ/配置
- Package: `infrastructure/repositories`
- File: `HabitRepository.ts`

## 3. 依存関係
- `SupabaseClient`

## 4. 公開メソッド/関数定義
### 4.1 `listHabits(userId, status?)`
- ユーザー習慣一覧取得。

### 4.2 `createHabit(userId, name, displayOrder)`
- 習慣作成。

### 4.3 `updateHabit(userId, habitId, payload)`
- 本人習慣のみ更新。

### 4.4 `setHabitStatus(userId, habitId, status)`
- active/archived 遷移。

### 4.5 `upsertCheckin(userId, habitId, logDate, checkedInAt)`
- `habit_logs(habit_id,log_date)` ユニークでUPSERT。

### 4.6 `deleteCheckin(userId, habitId, logDate)`
- 当日分削除。

### 4.7 `findLogsByDateRange(userId, fromDate, toDate, includeArchived)`
- 履歴取得。

## 5. 内部構造
```ts
type HabitStatus = 'active'|'archived';
```

## 6. エラーハンドリング
- `HABIT_NOT_FOUND`
- `HABIT_NOT_ACTIVE`
- `CHECKIN_CONFLICT`
