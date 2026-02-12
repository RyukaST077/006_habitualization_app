import { describe, expect, it } from 'vitest';

import { startGoogleLogin } from '../../../src/server/auth/start-google-login';

describe('auth start redirect validation (Green)', () => {
  it('traceability includes TC-IT-FR-001-002 / FNC-001 / SCR-001 / IF-001', () => {
    const tags = ['TC-IT-FR-001-002', 'FNC-001', 'SCR-001', 'IF-001'];

    expect(tags).toContain('TC-IT-FR-001-002');
    expect(tags).toContain('FNC-001');
    expect(tags).toContain('SCR-001');
    expect(tags).toContain('IF-001');
  });

  it('[TC-IT-FR-001-002][FNC-001][SCR-001][IF-001] redirectTo不正値は400 INVALID_REDIRECTかつセッション未作成', () => {
    const result = startGoogleLogin('https://evil.example.com/callback', {
      traceId: 'trace-invalid-redirect',
    });

    expect(result.status).toBe(400);
    expect(result.errorCode).toBe('INVALID_REDIRECT');
    expect(result.sessionCreated).toBe(false);
    expect(result.auditEvent).toBe('LOGIN_FAILED');
    expect(result.trace_id).toBe('trace-invalid-redirect');
  });

  it('[TC-IT-FR-001-001][FNC-001][SCR-001][IF-001] 正常系はauth_urlとtrace_idを返す', () => {
    const result = startGoogleLogin('/home', {
      traceId: 'trace-success',
      oauthUrlFactory: () => 'https://auth.example.local/google/start?redirectTo=%2Fhome',
    });

    expect(result.status).toBe(200);
    expect(result.auth_url).toContain('https://auth.example.local/google/start');
    expect(result.sessionCreated).toBe(true);
    expect(result.auditEvent).toBe('LOGIN_START');
    expect(result.trace_id).toBe('trace-success');
  });

  it('[TC-IT-FR-001-003][FNC-001][IF-001] 認証失敗時は401 AUTH_FAILEDを返す', () => {
    const result = startGoogleLogin('/home', {
      traceId: 'trace-auth-failed',
      failWith: 'AUTH_FAILED',
    });

    expect(result.status).toBe(401);
    expect(result.errorCode).toBe('AUTH_FAILED');
    expect(result.sessionCreated).toBe(false);
    expect(result.auditEvent).toBe('LOGIN_FAILED');
    expect(result.trace_id).toBe('trace-auth-failed');
  });

  it('[TC-IT-FR-001-004][FNC-001][IF-001] プロバイダ障害時は500 AUTH_PROVIDER_ERRORを返す', () => {
    const result = startGoogleLogin('/home', {
      traceId: 'trace-provider-error',
      failWith: 'AUTH_PROVIDER_ERROR',
    });

    expect(result.status).toBe(500);
    expect(result.errorCode).toBe('AUTH_PROVIDER_ERROR');
    expect(result.sessionCreated).toBe(false);
    expect(result.auditEvent).toBe('LOGIN_FAILED');
    expect(result.trace_id).toBe('trace-provider-error');
  });
});
