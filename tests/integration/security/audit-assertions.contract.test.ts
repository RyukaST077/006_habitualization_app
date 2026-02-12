import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('audit assertions contract (Red)', () => {
  it('defines audit logger with action/result/trace_id fields', () => {
    const path = resolve('src/server/common/audit/AuditLogger.ts');
    expect(existsSync(path), 'Audit logger contract not implemented').toBe(true);

    const source = readFileSync(path, 'utf8');
    expect(source).toContain('audit');
    expect(source).toContain('action');
    expect(source).toContain('result');
    expect(source).toContain('trace_id');
  });
});
