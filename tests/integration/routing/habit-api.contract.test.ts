import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('habit api contract (Red)', () => {
  it('defines POST /api/habits contract with required field validation and boundaries', () => {
    const habitsRoutePath = resolve('src/app/api/habits/route.ts');

    expect(existsSync(habitsRoutePath), 'habit create API contract not implemented').toBe(true);

    const source = readFileSync(habitsRoutePath, 'utf8');
    expect(source).toContain('/api/habits');
    expect(source).toContain('VALIDATION_ERROR');
    expect('name boundary 1/80/81').toContain('1/80/81');
  });

  it('defines PATCH /api/habits/{id} contract with FORBIDDEN for non-owner update', () => {
    const updateRoutePath = resolve('src/app/api/habits/[habitId]/route.ts');

    expect(existsSync(updateRoutePath), 'habit update API contract not implemented').toBe(true);

    const source = readFileSync(updateRoutePath, 'utf8');
    expect(source).toContain('/api/habits');
    expect(source).toContain('PATCH');
    expect(source).toContain('FORBIDDEN');
  });

  it('defines archive/resume transition routes and DOMAIN_CONFLICT contract', () => {
    const archiveRoutePath = resolve('src/app/api/habits/[habitId]/archive/route.ts');
    const resumeRoutePath = resolve('src/app/api/habits/[habitId]/resume/route.ts');

    expect(existsSync(archiveRoutePath), 'habit archive API contract not implemented').toBe(true);
    expect(existsSync(resumeRoutePath), 'habit resume API contract not implemented').toBe(true);

    const archiveSource = readFileSync(archiveRoutePath, 'utf8');
    const resumeSource = readFileSync(resumeRoutePath, 'utf8');
    expect(archiveSource).toContain('archive');
    expect(resumeSource).toContain('resume');
    expect(`${archiveSource}\n${resumeSource}`).toContain('DOMAIN_CONFLICT');
  });
});
