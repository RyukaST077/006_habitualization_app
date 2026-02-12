import { describe, it } from 'vitest';

import {
  expectErrorContract,
  expectRepositoryMethods,
  expectSourceKeywords,
  loadRepositorySource,
} from '../../helpers/db/repository-contract-assertions';

describe('M-103 PolicyRepository contract (Red)', () => {
  it('defines policy methods and POLICY_VERSION_CONFLICT handling for Tx-safe updates', () => {
    const sourceCode = loadRepositorySource('src/server/infrastructure/repositories/PolicyRepository.ts');

    expectRepositoryMethods(sourceCode, 'PolicyRepository', [
      'getCurrentPolicies',
      'findUserLatestConsents',
      'insertConsents',
      'updatePolicySetting',
    ]);
    expectErrorContract(sourceCode, ['POLICY_VERSION_CONFLICT', 'POLICY_NOT_FOUND']);
    expectSourceKeywords(sourceCode, ['transaction', 'policy_settings', 'policy_consents']);
  });
});

