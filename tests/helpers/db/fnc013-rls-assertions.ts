import { loadSourceFile } from '../source-cache';

export function loadFnc013Sql(relativePath: string): string {
  return loadSourceFile(relativePath, 'FNC-013 RLS contract not implemented');
}

export function expectRlsKeywords(sql: string): void {
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('auth.uid() = user_id');
  expect(sql).toContain('FORBIDDEN');
}
