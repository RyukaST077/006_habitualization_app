import { describe, it } from 'vitest';

import {
  expectErrorResponseContract,
  expectValidationKeywords,
  requireApiRoute,
} from '../../helpers/api/contract-assertions';

describe('IF-002 error status contract (Red)', () => {
  it('prevents invalid timezone/cutoff before business-date resolution', () => {
    const settingsSource = requireApiRoute('src/app/api/settings/profile/route.ts');
    expectValidationKeywords(settingsSource, ['timezone', 'dayCutoffTime', 'VALIDATION_ERROR']);
  });

  it('maps authorization violations to 403 FORBIDDEN', () => {
    const sourceCode = requireApiRoute('src/server/api/if002-errors.ts');
    expectValidationKeywords(sourceCode, ['403', 'FORBIDDEN']);
    expectErrorResponseContract(sourceCode);
  });

  it('maps domain conflicts to 409 DOMAIN_CONFLICT', () => {
    const sourceCode = requireApiRoute('src/server/api/if002-errors.ts');
    expectValidationKeywords(sourceCode, ['409', 'DOMAIN_CONFLICT']);
    expectErrorResponseContract(sourceCode);
  });

  it('maps unexpected failures to 500 INTERNAL_ERROR with trace_id', () => {
    const sourceCode = requireApiRoute('src/server/api/if002-errors.ts');
    expectValidationKeywords(sourceCode, ['500', 'INTERNAL_ERROR', 'trace_id']);
    expectErrorResponseContract(sourceCode);
  });
});
