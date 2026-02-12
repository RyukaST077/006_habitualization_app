import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function requireApiRoute(relativePath: string): string {
  const absolutePath = resolve(relativePath);

  expect(existsSync(absolutePath), `IF-002 route contract not implemented: ${relativePath}`).toBe(true);

  return readFileSync(absolutePath, 'utf8');
}

export function expectValidationKeywords(sourceCode: string, keywords: string[]): void {
  for (const keyword of keywords) {
    expect(sourceCode, `Expected validation keyword: ${keyword}`).toContain(keyword);
  }
}

