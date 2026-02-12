import { describe, it } from 'vitest';

import {
  expectErrorContract,
  expectRepositoryMethods,
  loadRepositorySource,
} from '../../helpers/db/repository-contract-assertions';

describe('M-102 HabitRepository contract (Red)', () => {
  it('defines habit CRUD and checkin methods with CHECKIN_CONFLICT handling', () => {
    const sourceCode = loadRepositorySource('src/server/infrastructure/repositories/HabitRepository.ts');

    expectRepositoryMethods(sourceCode, 'HabitRepository', [
      'listHabits',
      'createHabit',
      'updateHabit',
      'setHabitStatus',
      'upsertCheckin',
      'deleteCheckin',
      'findLogsByDateRange',
    ]);
    expectErrorContract(sourceCode, ['CHECKIN_CONFLICT', 'HABIT_NOT_FOUND', 'HABIT_NOT_ACTIVE']);
  });
});

