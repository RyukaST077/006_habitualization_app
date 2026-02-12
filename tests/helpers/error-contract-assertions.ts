import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadCommonErrorSource(relativePath: string): string {
  const absolutePath = resolve(relativePath);
  expect(existsSync(absolutePath), `AppError contract not implemented: ${relativePath}`).toBe(true);
  return readFileSync(absolutePath, 'utf8');
}

export function expectErrorKeywords(source: string): void {
  expect(source).toContain('AppError');
  expect(source).toContain('trace_id');
  expect(source).toContain('FORBIDDEN');
  expect(source).toContain('INTERNAL_ERROR');
}
