# M-014 AuthorizationPolicyService

## 1. 概要
API層での事前認可（本人判定、ロール判定）を統一する。

## 2. パッケージ/配置
- Package: `application/authz`
- File: `AuthorizationPolicyService.ts`

## 3. 依存関係
- `M-010 AuditLogService`

## 4. 公開メソッド
### 4.1 `assertSelf(userId, targetUserId)`
- 不一致時 `FORBIDDEN` を返す。

### 4.2 `assertOpsRole(role)`
- ROLE-002 以外は拒否。

## 5. 内部構造
```ts
export type Role = 'ROLE-001' | 'ROLE-002' | 'system';
```

## 6. エラー
- `FORBIDDEN`
