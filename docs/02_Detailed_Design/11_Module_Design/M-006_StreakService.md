# M-006 StreakService

## 1. 概要
ストリーク（猶予1日、2日未達リセット）を算出する。

## 2. パッケージ/配置
- Package: `application/streak`
- File: `StreakService.ts`

## 3. 依存関係
- `M-102 HabitRepository`

## 4. 公開メソッド
### 4.1 `calculateCurrentStreak(userId, habitId, baseDate)`
1. habit_logsを新しい順に取得。
2. 連続日判定を実施。
3. 猶予1日維持、2日未達で0にリセット。

## 5. 内部構造
```ts
type StreakInfo = { current: number; graceUsed: boolean; lastLogDate?: string };
```

## 6. エラー
- `HABIT_NOT_FOUND`
