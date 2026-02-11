# M-007 HistoryService

## 1. 概要
履歴/カレンダー画面向けデータを取得する。

## 2. パッケージ/配置
- Package: `application/history`
- File: `HistoryService.ts`

## 3. 依存関係
- `M-102 HabitRepository`
- `M-006 StreakService`

## 4. 公開メソッド
### 4.1 `getCalendarHistory(userId, yearMonth, includeArchived, habitId?)`
1. 対象月の日付範囲を計算。
2. habit/status条件でログ取得。
3. カレンダーセル状態へ変換。

## 5. 内部構造
```ts
interface CalendarCell { date: string; status: 'checked'|'missed'|'grace'; }
```

## 6. エラー
- `INVALID_YEAR_MONTH`
