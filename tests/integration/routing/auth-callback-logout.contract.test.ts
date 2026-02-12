import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('auth callback/logout api contract (Red)', () => {
  it('defines auth callback route with AUTH_FAILED/AUTH_PROVIDER_ERROR mapping', () => {
    const callbackPath = resolve('src/app/api/auth/google/callback/route.ts');
    expect(existsSync(callbackPath), 'auth callback contract not implemented').toBe(true);

    const source = readFileSync(callbackPath, 'utf8');
    expect(source).toContain('callback');
    expect(source).toContain('AUTH_FAILED');
    expect(source).toContain('AUTH_PROVIDER_ERROR');
  });

  it('defines auth logout route', () => {
    const logoutPath = resolve('src/app/api/auth/logout/route.ts');
    expect(existsSync(logoutPath), 'auth logout contract not implemented').toBe(true);

    const source = readFileSync(logoutPath, 'utf8');
    expect(source).toContain('logout');
  });
});
