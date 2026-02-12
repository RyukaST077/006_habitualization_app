import type { CommonUiErrorDto, CommonUiErrorStatus } from '../../../src/components/common/common-ui-types';

export type CommonUiErrorDisplayFixture = {
  id: string;
  status: CommonUiErrorStatus;
  dto: CommonUiErrorDto;
  requiredTokens: string[];
  forbiddenTokens: string[];
};

export type CommonUiErrorDisplayFixtures = {
  FORBIDDEN_403: CommonUiErrorDisplayFixture;
  DOMAIN_CONFLICT_409: CommonUiErrorDisplayFixture;
  INTERNAL_500_TRACE_BOUNDARY: CommonUiErrorDisplayFixture;
};

const BASE_ERROR_DISPLAY_FIXTURES: CommonUiErrorDisplayFixtures = {
  FORBIDDEN_403: {
    id: 'SCR-COM-3.2-403',
    status: 403,
    dto: {
      status: 403,
      code: 'FORBIDDEN',
      message: 'internal_reason: policy_mismatch',
      trace_id: 'trace-forbidden',
      requirement_id: 'SCR-COM-3.2-403',
    },
    requiredTokens: ['403', 'inline-top'],
    forbiddenTokens: ['internal_reason'],
  },
  DOMAIN_CONFLICT_409: {
    id: 'SCR-COM-3.2-409',
    status: 409,
    dto: {
      status: 409,
      code: 'CONFLICT',
      message: '競合が発生しました。再開してください。',
      trace_id: 'trace-conflict',
      requirement_id: 'SCR-COM-3.2-409',
    },
    requiredTokens: ['409', 'toast', '再開'],
    forbiddenTokens: [],
  },
  INTERNAL_500_TRACE_BOUNDARY: {
    id: 'SCR-COM-3.2-500',
    status: 500,
    dto: {
      status: 500,
      code: 'INTERNAL_ERROR',
      message: '予期しないエラーが発生しました。',
      trace_id: 'trace-internal',
      requirement_id: 'SCR-COM-3.2-500',
    },
    requiredTokens: ['500', 'trace_id', 'status === 500', 'status !== 500', 'toast'],
    forbiddenTokens: [],
  },
};

export const COMMON_UI_HEADER_REQUIRED_ITEMS = ['ロゴ', 'ホーム', '履歴', '設定', 'ログアウト'] as const;

export const COMMON_UI_FOOTER_REQUIRED_ITEMS = ['利用規約', 'プライバシーポリシー', 'コピーライト'] as const;

export const COMMON_UI_HEADER_PERSISTENCE_ITEMS = ['ホーム', '履歴', '設定'] as const;

export function createCommonUiErrorDisplayFixtures(): CommonUiErrorDisplayFixtures {
  return {
    FORBIDDEN_403: {
      ...BASE_ERROR_DISPLAY_FIXTURES.FORBIDDEN_403,
      requiredTokens: [...BASE_ERROR_DISPLAY_FIXTURES.FORBIDDEN_403.requiredTokens],
      forbiddenTokens: [...BASE_ERROR_DISPLAY_FIXTURES.FORBIDDEN_403.forbiddenTokens],
    },
    DOMAIN_CONFLICT_409: {
      ...BASE_ERROR_DISPLAY_FIXTURES.DOMAIN_CONFLICT_409,
      requiredTokens: [...BASE_ERROR_DISPLAY_FIXTURES.DOMAIN_CONFLICT_409.requiredTokens],
      forbiddenTokens: [...BASE_ERROR_DISPLAY_FIXTURES.DOMAIN_CONFLICT_409.forbiddenTokens],
    },
    INTERNAL_500_TRACE_BOUNDARY: {
      ...BASE_ERROR_DISPLAY_FIXTURES.INTERNAL_500_TRACE_BOUNDARY,
      requiredTokens: [...BASE_ERROR_DISPLAY_FIXTURES.INTERNAL_500_TRACE_BOUNDARY.requiredTokens],
      forbiddenTokens: [...BASE_ERROR_DISPLAY_FIXTURES.INTERNAL_500_TRACE_BOUNDARY.forbiddenTokens],
    },
  };
}
