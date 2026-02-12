import { describe, it } from 'vitest';

import { expectValidationKeywords, requireApiRoute } from '../../helpers/api/contract-assertions';

describe('IF-002 checkins business-date contract (T-042 Red)', () => {
  it('TC-IT-FR-010-003: expects timezone-dependent log_date contract in POST /api/checkins', () => {
    const sourceCode = requireApiRoute('src/app/api/checkins/route.ts');
    expectValidationKeywords(sourceCode, ['/api/checkins', 'log_date', 'timezone', 'dayCutoffTime']);
  });

  it('records business-date calculation trace in checkin flow', () => {
    const sourceCode = requireApiRoute('src/app/api/checkins/route.ts');
    expectValidationKeywords(sourceCode, ['M-004', 'resolveLogDate', 'log_date']);
  });
});
