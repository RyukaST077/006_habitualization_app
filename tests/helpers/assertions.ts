import { expect } from 'vitest';

export function expectHttpStatus(actual: number, expected: number): void {
  expect(actual).toBe(expected);
}

export function expectErrorShape(value: unknown, requiredPrefix?: string): void {
  expect(value).toBeInstanceOf(Error);

  const error = value as Error;
  expect(error.message.length).toBeGreaterThan(0);

  if (requiredPrefix) {
    expect(error.message).toContain(requiredPrefix);
  }
}

export function expectGuardRedirect(
  actualPath: '/login' | '/policy-consent' | '/home',
  expectedPath: '/login' | '/policy-consent' | '/home',
): void {
  expect(actualPath).toBe(expectedPath);
}

export function expectSessionDestroyed(actual: boolean, expected: boolean): void {
  expect(actual).toBe(expected);
}
