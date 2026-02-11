# M-001 AuthSessionService

## 1. 概要
Google認証開始とセッション確立後の遷移判定を担当する。

## 2. パッケージ/配置
- Package: `application/auth`
- File: `AuthSessionService.ts`

## 3. 依存関係
- `SupabaseAuthGateway`: OAuth開始/セッション取得
- `M-002 ConsentService`: 同意要否判定
- `M-010 AuditLogService`: 認証監査

## 4. 公開メソッド/関数定義
### 4.1 `startGoogleLogin(redirectTo: string)`
| 引数名 | 型 | 必須 | 説明 |
| -- | -- | -- | -- |
| redirectTo | string | 〇 | 認証成功後遷移先 |

| 型 | 説明 |
| -- | -- |
| `{authUrl:string, traceId:string}` | OAuth開始情報 |
| AppError | 失敗 |

処理フロー:
1. redirectTo検証。
2. Supabase OAuth URLを生成。
3. 監査ログへ `LOGIN_START` 記録。

### 4.2 `resolvePostLogin(userId: string)`
1. 同意状態を `ConsentService` で判定。
2. 未同意なら `SCR-008`、同意済みなら `SCR-002` を返す。

## 5. 内部構造
```ts
export class AuthSessionService {
  constructor(private authGateway: SupabaseAuthGateway) {}
}
```

## 6. エラーハンドリング
- OAuth初期化失敗: `AUTH_PROVIDER_ERROR`。
- セッション不正: `UNAUTHORIZED`。
