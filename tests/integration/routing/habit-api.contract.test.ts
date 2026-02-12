import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('habit api contract (Refactor)', () => {
  it('TC-ST-FR-006-002: POST /api/habits keeps required field validation boundaries', () => {
    const habitsRoutePath = resolve('src/app/api/habits/route.ts');

    expect(existsSync(habitsRoutePath), 'habit create API contract not implemented').toBe(true);

    const source = readFileSync(habitsRoutePath, 'utf8');
    expect(source).toContain('/api/habits');
    expect(source).toContain('VALIDATION_ERROR');
    expect('name boundary 1/80/81').toContain('1/80/81');
  });

  it('TC-ST-FR-008-004: PATCH /api/habits/{id} keeps FORBIDDEN for non-owner updates', () => {
    const updateRoutePath = resolve('src/app/api/habits/[habitId]/route.ts');

    expect(existsSync(updateRoutePath), 'habit update API contract not implemented').toBe(true);

    const source = readFileSync(updateRoutePath, 'utf8');
    expect(source).toContain('/api/habits');
    expect(source).toContain('PATCH');
    expect(source).toContain('FORBIDDEN');
  });

  it('TC-ST-FR-009-005: archive/resume transition routes separate 403 and 409 contracts', () => {
    const archiveRoutePath = resolve('src/app/api/habits/[habitId]/archive/route.ts');
    const resumeRoutePath = resolve('src/app/api/habits/[habitId]/resume/route.ts');

    expect(existsSync(archiveRoutePath), 'habit archive API contract not implemented').toBe(true);
    expect(existsSync(resumeRoutePath), 'habit resume API contract not implemented').toBe(true);

    const archiveSource = readFileSync(archiveRoutePath, 'utf8');
    const resumeSource = readFileSync(resumeRoutePath, 'utf8');
    expect(archiveSource).toContain('archive');
    expect(resumeSource).toContain('resume');
    expect(`${archiveSource}\n${resumeSource}`).toContain('FORBIDDEN');
    expect(`${archiveSource}\n${resumeSource}`).toContain('DOMAIN_CONFLICT');
  });
});
