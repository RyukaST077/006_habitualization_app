import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('error display contracts (Red)', () => {
  it('SCR-COM-3.2-403: 403は画面上部インライン表示で詳細理由を露出しない', () => {
    const target = resolve('src/components/common/error-display.tsx');

    expect(existsSync(target)).toBe(true);

    if (existsSync(target)) {
      const content = readFileSync(target, 'utf8');
      expect(content).toContain('403');
      expect(content).toContain('inline-top');
      expect(content).not.toContain('internal_reason');
    }
  });

  it('SCR-COM-3.2-409: 409はトースト + 業務導線表示を持つ', () => {
    const target = resolve('src/components/common/error-display.tsx');

    expect(existsSync(target)).toBe(true);

    if (existsSync(target)) {
      const content = readFileSync(target, 'utf8');
      expect(content).toContain('409');
      expect(content).toContain('toast');
      expect(content).toContain('再開');
    }
  });

  it('SCR-COM-3.2-500: 500のみtrace_idを表示し、400/403/409では非表示', () => {
    const target = resolve('src/components/common/error-display.tsx');

    expect(existsSync(target)).toBe(true);

    if (existsSync(target)) {
      const content = readFileSync(target, 'utf8');
      expect(content).toContain('500');
      expect(content).toContain('trace_id');
      expect(content).toContain('status === 500');
      expect(content).toContain('status !== 500');
    }
  });
});
