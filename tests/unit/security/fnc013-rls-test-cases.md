# FNC-013 RLS / Authorization Test Cases (T-028 / Red)

## 対象
- FNC-013 アクセス制御・監査必須項目
- IF-002 API 認可境界
- M-014 AuthorizationPolicyService

## RLS SQL観点
- `enable row level security` が対象テーブルで有効化される。
- `auth.uid() = user_id` の本人スコープ制約を持つ。
- 参照系で本人以外は `FORBIDDEN` 相当となる。
- 監査対象データ（audit_logs）が最小権限で参照制御される。

## API事前認可観点（M-014）
- `assertSelf(userId, targetUserId)` は不一致時 `FORBIDDEN`。
- `assertOpsRole(role)` は `ROLE-002` 以外を拒否。
- `Role = ROLE-001 | ROLE-002 | system` を契約として固定する。

## 期待テスト（Red）
- SQL契約テスト: FNC-013専用SQLファイル未実装時に失敗。
- 認可サービス契約テスト: `AuthorizationPolicyService.ts` 未実装時に失敗。
- サマリーテスト: `T-029` 未実装のため失敗。

## Red判定
- RLS SQLが未整備、または必須キーワードが欠落している場合に失敗する。
- `assertSelf` / `assertOpsRole` / `FORBIDDEN` 契約が満たされない場合に失敗する。
- `T-029` 向けの実装導線が未解決であることを失敗で示す。

## 期待失敗ログ（T-029前）
- `FNC-013 RLS contract not implemented`
- `AuthorizationPolicyService contract not implemented`
- `T-029 FNC-013 contract not implemented`

