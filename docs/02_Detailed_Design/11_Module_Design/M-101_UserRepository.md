# M-101 UserRepository

## 1. 概要
`profiles` と `user_daily_activity` を操作するRepository。

## 2. パッケージ/配置
- Package: `infrastructure/repositories`
- File: `UserRepository.ts`

## 3. 依存関係
- `SupabaseClient`

## 4. 公開メソッド/関数定義
### 4.1 `findProfile(userId)`
| 引数名 | 型 | 必須 | 説明 |
| -- | -- | -- | -- |
| userId | string | 〇 | ユーザーID |

返り値:
| 型 | 説明 |
| -- | -- |
| Profile | profiles行 |
| null | 未存在 |

### 4.2 `updateProfileSettings(userId, timezone, cutoff, version)`
- version一致時のみ更新（楽観ロック）。

### 4.3 `incrementDailyActivity(userId, logDate, loginDelta, checkinDelta)`
- `user_daily_activity` をUPSERT。

### 4.4 `markAccountDisabled(userId, disabledAt)`
- `profiles.account_status='disabled'` を設定。

## 5. 内部構造
```ts
type Profile = {
  userId: string;
  timezone: string;
  dayCutoffTime: string;
  accountStatus: 'active'|'disabled'|'deleted';
  version: number;
};
```

## 6. エラーハンドリング
- `PROFILE_NOT_FOUND`
- `OPTIMISTIC_LOCK_CONFLICT`
- `REPOSITORY_ERROR`
