# M-008 SettingsService

## 1. 概要
TZ/締め時刻の取得・更新を提供する。

## 2. パッケージ/配置
- Package: `application/settings`
- File: `SettingsService.ts`

## 3. 依存関係
- `M-101 UserRepository`
- `M-010 AuditLogService`

## 4. 公開メソッド
### 4.1 `getProfileSettings(userId)`
- profilesから timezone/day_cutoff_time を返却。

### 4.2 `updateProfileSettings(userId, timezone, cutoff)`
1. IANA TZ・HH:mmを検証。
2. profiles更新（version更新）。
3. `SETTINGS_UPDATE` 監査記録。

## 5. 内部構造
```ts
type SettingsInput = { timezone: string; dayCutoffTime: string };
```

## 6. エラー
- `INVALID_TIMEZONE`
- `INVALID_CUTOFF_TIME`
