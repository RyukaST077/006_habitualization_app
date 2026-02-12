import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect } from 'vitest';

import { getSafeErrorMessage, shouldDisplayTraceId } from '../../../src/components/common/common-ui-types';
import type { CommonUiErrorDisplayFixture } from './common-ui-fixtures';

const sourceFileCache = new Map<string, string>();

export function expectSourceFileExists(relativePath: string): boolean {
  const absolutePath = resolve(relativePath);
  return existsSync(absolutePath);
}

export function readSourceFile(relativePath: string): string {
  const absolutePath = resolve(relativePath);
  const cached = sourceFileCache.get(absolutePath);
  if (cached) {
    return cached;
  }

  const source = readFileSync(absolutePath, 'utf8');
  sourceFileCache.set(absolutePath, source);
  return source;
}

export function readSourceFiles(relativePaths: readonly string[]): Record<string, string> {
  return Object.fromEntries(relativePaths.map((path) => [path, readSourceFile(path)]));
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

  const shouldShowTraceId = fixture.status === 500;
  expect(shouldDisplayTraceId(fixture.dto)).toBe(shouldShowTraceId);
  if (fixture.dto.status === 403) {
    expect(getSafeErrorMessage(fixture.dto)).not.toContain('internal_reason');
  }
}
