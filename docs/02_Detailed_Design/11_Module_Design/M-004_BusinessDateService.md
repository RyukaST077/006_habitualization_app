# M-004 BusinessDateService

## 1. 概要
ユーザーTZと締め時刻から `log_date` を算出する。

## 2. パッケージ/配置
- Package: `domain/time`
- File: `BusinessDateService.ts`

## 3. 依存関係
- なし（純粋ドメインロジック）

## 4. 公開メソッド
### 4.1 `resolveLogDate(nowUtc, timezone, cutoffTime)`
1. `nowUtc` を `timezone` に変換。
2. `localTime < cutoffTime` の場合は前日、そうでなければ当日。
3. `YYYY-MM-DD` を返却。

## 5. 内部構造
```ts
type BusinessDateInput = { nowUtc: Date; timezone: string; cutoff: string };
```

## 6. エラー
- `INVALID_TIMEZONE`
- `INVALID_CUTOFF_TIME`
