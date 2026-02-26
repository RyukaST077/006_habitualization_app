# M-001 AuthSessionService

## 1. 概要
Google認証開始とセッション確立後の遷移判定を担当する。

## 2. パッケージ/配置
- Package: `application/auth`
- File: `AuthSessionService.ts`

## 3. 依存関係
- `SupabaseAuthGateway`: OAuth開始/セッション取得
- `ConsentStatusPort`: 同意要否判定（実装側で `policy_settings` / `policy_consents` 参照）
- `M-010 AuditLogService`: 認証監査 / 同意監査

## 4. 公開メソッド/関数定義
### 4.1 `startGoogleLogin(redirectTo: string)`
| 引数名 | 型 | 必須 | 説明 |
| -- | -- | -- | -- |
| redirectTo | string | 〇 | 認証成功後遷移先 |

| 型 | 説明 |
| -- | -- |
| `{authUrl:string, traceId:string, auditAction:'LOGIN_START'}` | OAuth開始情報 |
| AppError | 失敗 |

処理フロー:
1. redirectTo検証。
2. Supabase OAuth URLを生成。
3. 監査ログへ `LOGIN_START`（`FR-001`）記録。

### 4.2 `resolvePostLogin(userId: string)`
1. 同意状態を `ConsentStatusPort` で判定。
2. 未同意なら `SCR-008`、同意済みなら `SCR-002` を返す。
3. 同意監査を `POLICY_CONSENT_ACCEPT` で記録する（同意済み=`SUCCESS`、未同意=`FAILED`、`FR-026`）。

### 4.3 `rejectConsentAndLogout(userId: string)`
1. `SupabaseAuthGateway.clearSession(userId)` でセッション破棄。
2. 同意拒否監査を `POLICY_CONSENT_REJECT`（`FR-026`）で記録。
3. `SCR-001` / `sessionCleared=true` / `auditAction=POLICY_CONSENT_REJECT` を返す。

## 5. 内部構造
```ts
export class AuthSessionService {
  constructor(private authGateway: SupabaseAuthGateway) {}
}
```

## 6. エラーハンドリング
- OAuth初期化失敗: `AUTH_PROVIDER_ERROR`。
- セッション不正: `UNAUTHORIZED`。
