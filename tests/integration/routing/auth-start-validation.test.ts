import { describe, expect, it } from 'vitest';

type AuthStartResult = {
  status: 200 | 400 | 401 | 500;
  errorCode?: 'INVALID_REDIRECT' | 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR';
  sessionCreated: boolean;
  auditEvent: 'LOGIN_START' | 'LOGIN_SUCCESS' | 'LOGIN_FAILED';
};

type RedirectValidationCase = {
  caseId: string;
  redirectTo: string;
  expectedStatus: 400;
  expectedErrorCode: 'INVALID_REDIRECT';
  expectedSessionCreated: false;
  expectedAuditEvent: 'LOGIN_FAILED';
  traceability: string[];
};

const INVALID_REDIRECT_CASES: RedirectValidationCase[] = [
  {
    caseId: 'TC-IT-FR-001-002-INVALID-ABSOLUTE-URL',
    redirectTo: 'https://evil.example.com/callback',
    expectedStatus: 400,
    expectedErrorCode: 'INVALID_REDIRECT',
    expectedSessionCreated: false,
    expectedAuditEvent: 'LOGIN_FAILED',
    traceability: ['TC-IT-FR-001-002', 'FNC-001', 'SCR-001', 'IF-001'],
  },
];

function startGoogleLogin(_redirectTo: string): AuthStartResult {
  throw new Error(
    'Auth start is not implemented: expected 400 INVALID_REDIRECT and sessionCreated=false',
  );
}

describe('auth start redirect validation (Red)', () => {
  it('traceability includes TC-IT-FR-001-002 / FNC-001 / SCR-001 / IF-001', () => {
    const tags = INVALID_REDIRECT_CASES.flatMap((testCase) => testCase.traceability);

    expect(tags).toContain('TC-IT-FR-001-002');
    expect(tags).toContain('FNC-001');
    expect(tags).toContain('SCR-001');
    expect(tags).toContain('IF-001');
  });

  it('[TC-IT-FR-001-002][FNC-001][SCR-001][IF-001] redirectTo不正値は400 INVALID_REDIRECTかつセッション未作成', () => {
    const result = startGoogleLogin(INVALID_REDIRECT_CASES[0].redirectTo);

    expect(result.status).toBe(400);
    expect(result.errorCode).toBe('INVALID_REDIRECT');
    expect(result.sessionCreated).toBe(false);
    expect(result.auditEvent).toBe('LOGIN_FAILED');
  });
});
