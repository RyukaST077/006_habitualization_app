import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadFnc013Sql(relativePath: string): string {
  const absolutePath = resolve(relativePath);
  expect(existsSync(absolutePath), `FNC-013 RLS contract not implemented: ${relativePath}`).toBe(true);
  return readFileSync(absolutePath, 'utf8');
}

export function expectRlsKeywords(sql: string): void {
  expect(sql).toContain('enable row level security');
  expect(sql).toContain('auth.uid() = user_id');
  expect(sql).toContain('FORBIDDEN');
}

