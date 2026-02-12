# Auth Contract Test Cases (T-033 / Red)

## 対象
- FNC-001 / IF-001 / SCR-001
- auth start / callback / logout

## 観点
- auth start は `redirectTo` を受け取り認証URLを返す。
- auth callback は認証成功時に `/home` へ遷移する。
- logout はセッション破棄後に `/login` へ遷移する。
- 失敗時 `AUTH_FAILED` / `AUTH_PROVIDER_ERROR` を返す。

## Red判定
- callback/logout route が未実装なら失敗。
- callback/logout usecase が未実装なら失敗。
- T-034未実装をサマリーテストで失敗として示す。

## 期待失敗
- auth callback contract not implemented
- auth logout contract not implemented
- T-034 auth contract not implemented
