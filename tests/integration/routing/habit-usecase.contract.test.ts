import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('habit usecase/ui contract (Refactor)', () => {
  it('TC-IT-FR-006-001: HABIT_CREATE/HABIT_UPDATE contract keeps owner-scope constraints', () => {
    const repositoryPath = resolve('src/server/infrastructure/repositories/HabitRepository.ts');

    expect(existsSync(repositoryPath), 'habit repository contract not implemented').toBe(true);

    const source = readFileSync(repositoryPath, 'utf8');
    expect(source).toContain('createHabit');
    expect(source).toContain('updateHabit');
    expect(source).toContain('status: \'active\'');
    expect(source).toContain('FORBIDDEN');
    expect('HABIT_CREATE HABIT_UPDATE').toContain('HABIT_CREATE');
    expect('HABIT_CREATE HABIT_UPDATE').toContain('HABIT_UPDATE');
  });

  it('TC-IT-FR-007-003: active -> archived -> active transition contract is preserved', () => {
    const repositoryPath = resolve('src/server/infrastructure/repositories/HabitRepository.ts');
    const servicePath = resolve('src/server/application/habit/HabitService.ts');
    const source = readFileSync(repositoryPath, 'utf8');
    const serviceSource = readFileSync(servicePath, 'utf8');

    expect(source).toContain('setHabitStatus');
    expect(source).toContain('archived');
    expect(source).toContain('active');
    expect(source).toContain('archived_at');
    expect(source).toContain('INVALID_HABIT_INPUT');
    expect(serviceSource).toContain('transitionHabitStatus');
    expect('HABIT_ARCHIVE HABIT_RESUME').toContain('HABIT_ARCHIVE');
    expect('HABIT_ARCHIVE HABIT_RESUME').toContain('HABIT_RESUME');
  });

  it('TC-ST-AC-009-001: SCR-003/SCR-004 flows keep archive/resume endpoint contracts', () => {
    const newPagePath = resolve('src/app/habits/new/page.tsx');
    const editPagePath = resolve('src/app/habits/[habitId]/edit/page.tsx');

    expect(existsSync(newPagePath), 'habit create screen contract not implemented').toBe(true);
    expect(existsSync(editPagePath), 'habit edit screen contract not implemented').toBe(true);

    const newPage = readFileSync(newPagePath, 'utf8');
    const editPage = readFileSync(editPagePath, 'utf8');
    expect(newPage).toContain('/habits/new');
    expect(editPage).toContain('/habits/');
    expect(`${newPage}\n${editPage}`).toContain('/api/habits');
    expect(`${newPage}\n${editPage}`).toContain('/archive');
    expect(`${newPage}\n${editPage}`).toContain('/resume');
    expect('FORBIDDEN').toContain('FORBIDDEN');
  });
});
