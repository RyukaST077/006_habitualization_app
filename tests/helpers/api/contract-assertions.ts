import { loadSourceFile } from '../source-cache';

export function requireApiRoute(relativePath: string): string {
  return loadSourceFile(relativePath, 'IF-002 route contract not implemented');
}

export function expectValidationKeywords(sourceCode: string, keywords: string[]): void {
  for (const keyword of keywords) {
    expect(sourceCode, `Expected validation keyword: ${keyword}`).toContain(keyword);
  }
}

export function expectErrorResponseContract(sourceCode: string): void {
  expect(sourceCode).toContain('FORBIDDEN');
  expect(sourceCode).toContain('DOMAIN_CONFLICT');
  expect(sourceCode).toContain('INTERNAL_ERROR');
  expect(sourceCode).toContain('trace_id');
}
