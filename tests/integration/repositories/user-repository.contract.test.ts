import { describe, it } from 'vitest';

import {
  expectErrorContract,
  expectRepositoryMethods,
  loadRepositorySource,
} from '../../helpers/db/repository-contract-assertions';

describe('M-101 UserRepository contract (Red)', () => {
  it('defines profile CRUD methods and OPTIMISTIC_LOCK_CONFLICT handling', () => {
    const sourceCode = loadRepositorySource('src/server/infrastructure/repositories/UserRepository.ts');

    expectRepositoryMethods(sourceCode, 'UserRepository', [
      'findProfile',
      'updateProfileSettings',
      'incrementDailyActivity',
      'markAccountDisabled',
    ]);
    expectErrorContract(sourceCode, ['OPTIMISTIC_LOCK_CONFLICT', 'PROFILE_NOT_FOUND']);
  });
});

