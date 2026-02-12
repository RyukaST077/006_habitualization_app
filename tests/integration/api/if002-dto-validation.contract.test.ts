import { describe, it } from 'vitest';

import { expectValidationKeywords, requireApiRoute } from '../../helpers/api/contract-assertions';

describe('IF-002 DTO/Validation contract (Red)', () => {
  it('defines GET /api/home/habits route with bearer auth guard', () => {
    const sourceCode = requireApiRoute('src/app/api/home/habits/route.ts');
    expectValidationKeywords(sourceCode, ['/api/home/habits', 'Authorization', 'Bearer']);
  });

  it('defines POST /api/habits route with required DTO validation', () => {
    const sourceCode = requireApiRoute('src/app/api/habits/route.ts');
    expectValidationKeywords(sourceCode, ['/api/habits', 'name', 'displayOrder', 'VALIDATION_ERROR']);
  });

  it('defines POST /api/checkins route with required DTO validation', () => {
    const sourceCode = requireApiRoute('src/app/api/checkins/route.ts');
    expectValidationKeywords(sourceCode, ['/api/checkins', 'habitId', 'logDate', 'checkedInAt']);
  });

  it('defines PATCH /api/settings/profile route with timezone/cutoff validation', () => {
    const sourceCode = requireApiRoute('src/app/api/settings/profile/route.ts');
    expectValidationKeywords(sourceCode, ['/api/settings/profile', 'timezone', 'dayCutoffTime']);
  });

  it('defines POST /api/settings/withdrawal route contract', () => {
    const sourceCode = requireApiRoute('src/app/api/settings/withdrawal/route.ts');
    expectValidationKeywords(sourceCode, ['/api/settings/withdrawal', 'Authorization', 'trace_id']);
  });
});

