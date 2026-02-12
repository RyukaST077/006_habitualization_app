# policy consent contract test cases (T-036 Red)

## Scope
- FNC-002: 同意判定・同意強制
- FNC-003: 同意履歴管理
- SCR-008: ポリシー同意画面
- IF-004: policy_settings更新
- TBL-006/TBL-007: policy_settings / policy_consents

## API Contract
- `GET /api/policies/current`
  - returns terms/privacy latest version from `policy_settings`
  - response must include `version` and `url`
- `POST /api/policies/consents`
  - writes consent records into `policy_consents`
  - accepts only `terms` and `privacy`
  - emits `POLICY_CONSENT_ACCEPT` audit event
- reject flow
  - keeps consent records unchanged
  - emits `POLICY_CONSENT_REJECT` audit event and returns login transition

## Validation / Error Contract
- invalid `policy_type` => `INVALID_POLICY_TYPE`
- version conflict => `VERSION_CONFLICT`
- persistence failure => `POLICY_UPDATE_FAILED`
- unauthenticated requests must be rejected by auth guard

## Red判定
- T-036 は期待失敗の契約テストを作成し、T-037 実装前に失敗することを確認する。
- 期待失敗:
  - `src/app/api/policies/current/route.ts` が未実装
  - `src/app/api/policies/consents/route.ts` が未実装
  - 同意判定/同意履歴UseCase が未実装
