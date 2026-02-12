import { loadSourceFile } from './source-cache';

export function loadCommonErrorSource(relativePath: string): string {
  return loadSourceFile(relativePath, 'AppError contract not implemented');
}

export function expectErrorKeywords(source: string): void {
  expect(source).toContain('AppError');
  expect(source).toContain('trace_id');
  expect(source).toContain('FORBIDDEN');
  expect(source).toContain('INTERNAL_ERROR');
}
