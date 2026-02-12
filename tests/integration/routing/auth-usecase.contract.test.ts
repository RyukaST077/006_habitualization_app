import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('auth usecase contract (Red)', () => {
  it('defines callback/logout usecases', () => {
    const callbackUsecase = resolve('src/server/auth/complete-google-login.ts');
    const logoutUsecase = resolve('src/server/auth/logout.ts');

    expect(existsSync(callbackUsecase), 'auth callback usecase contract not implemented').toBe(true);
    expect(existsSync(logoutUsecase), 'auth logout usecase contract not implemented').toBe(true);

    const callbackSource = readFileSync(callbackUsecase, 'utf8');
    expect(callbackSource).toContain('callback');
    expect(callbackSource).toContain('AUTH_FAILED');

    const logoutSource = readFileSync(logoutUsecase, 'utf8');
    expect(logoutSource).toContain('logout');
  });
});
