# M-103 PolicyRepository

## 1. 概要
`policy_settings` と `policy_consents` を操作するRepository。

## 2. パッケージ/配置
- Package: `infrastructure/repositories`
- File: `PolicyRepository.ts`

## 3. 依存関係
- `SupabaseClient`

## 4. 公開メソッド/関数定義
### 4.1 `getCurrentPolicies()`
- terms/privacy の current_version 取得。

### 4.2 `findUserLatestConsents(userId)`
- userごと最新同意版を取得。

### 4.3 `insertConsents(userId, consents)`
- 重複時は無変更成功。
- 同一 `(user_id, policy_type, policy_version)` は no-op（`insertedCount=0`, `duplicateCount=1`）。
- `policy_settings.current_version` より古い `policy_version` は `POLICY_VERSION_MISMATCH (409)` で拒否。
- `current_version` と同値または将来版の `policy_version` は登録可能（重複キーは no-op）。

### 4.4 `updatePolicySetting(policyType, newVersion, effectiveFrom, actor)`
- service role専用更新。

## 5. 内部構造
```ts
interface CurrentPolicy {
  policyType: 'terms'|'privacy';
  currentVersion: string;
  effectiveFrom: string;
}
```

## 6. エラーハンドリング
- `POLICY_NOT_FOUND`
- `POLICY_VERSION_CONFLICT`
- `POLICY_VERSION_MISMATCH`（同意登録時の旧版入力）
