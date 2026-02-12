import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const sourceCache = new Map<string, string>();

export function loadSourceFile(relativePath: string, missingMessage: string): string {
  const absolutePath = resolve(relativePath);
  expect(existsSync(absolutePath), `${missingMessage}: ${relativePath}`).toBe(true);

  const cached = sourceCache.get(absolutePath);
  if (cached) {
    return cached;
  }

  const source = readFileSync(absolutePath, 'utf8');
  sourceCache.set(absolutePath, source);
  return source;
}

export function clearSourceCache(): void {
  sourceCache.clear();
}
