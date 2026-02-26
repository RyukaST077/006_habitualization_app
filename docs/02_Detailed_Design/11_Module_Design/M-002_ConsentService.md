# M-002 ConsentService

## 1. 概要
policy_settings と policy_consents を比較して同意要否を判定し、同意受諾を記録する。

## 2. パッケージ/配置
- Package: `application/policy`
- File: `ConsentService.ts`

実装メモ:
- IF-001 認証callback経路では `AuthSessionService` の `ConsentStatusPort` を通じて同意判定を行う。
- 現行の開発実装では `vite.config.ts` 内の `ConsentStatusPort` 実装が `policy_settings` / `policy_consents` を参照して判定する。

## 3. 依存関係
- `M-103 PolicyRepository`
- `M-010 AuditLogService`

## 4. 公開メソッド
### 4.1 `getConsentRequirement(userId: string)`
- terms/privacy の最新版同意有無を返却。

### 4.2 `acceptPolicies(userId: string, consents: ConsentInput[])`
- 引数 `consents`: `policy_type/policy_version` 配列。
- 処理:
1. 最新版と一致するか検証。
2. `policy_consents` を一括insert（重複は無視）。
3. `POLICY_CONSENT_ACCEPT` 監査記録。

### 4.3 `rejectPolicies(userId: string)`
- セッション破棄を呼び出し側へ指示し、監査ログ記録。

## 5. 内部構造
```ts
type ConsentInput = { policyType: 'terms'|'privacy'; policyVersion: string };
```

## 6. エラー
- `POLICY_VERSION_MISMATCH`
- `CONSENT_ALREADY_EXISTS`（業務上は成功扱い）
