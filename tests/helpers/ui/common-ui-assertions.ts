import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';

import type { CommonUiErrorDisplayFixture } from './common-ui-fixtures';

export function expectSourceFileExists(relativePath: string): boolean {
  const absolutePath = resolve(relativePath);
  const exists = existsSync(absolutePath);
  expect(exists).toBe(true);
  return exists;
}

export function readSourceFile(relativePath: string): string {
  return readFileSync(resolve(relativePath), 'utf8');
}

export function expectContainsAll(content: string, requiredTokens: readonly string[]): void {
  for (const token of requiredTokens) {
    expect(content).toContain(token);
  }
}

export function expectContainsNone(content: string, forbiddenTokens: readonly string[]): void {
  for (const token of forbiddenTokens) {
    expect(content).not.toContain(token);
  }
}

export function expectErrorDisplayFixture(
  content: string,
  fixture: CommonUiErrorDisplayFixture,
): void {
  expectContainsAll(content, fixture.requiredTokens);
  expectContainsNone(content, fixture.forbiddenTokens);
  expect(content).toContain(String(fixture.status));
}
