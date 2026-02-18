import { describe, expect, it } from 'vitest';

import { requireApiRoute } from '../../helpers/api/contract-assertions';

describe('T-050 PR-003 refactor summary', () => {
  it('keeps cancel contract markers after route/repository refactor', () => {
    const routeSource = requireApiRoute('src/app/api/checkins/route.ts');
    const repositorySource = requireApiRoute('src/server/infrastructure/repositories/HabitRepository.ts');

    expect(routeSource).toContain('CHECKIN_CANCEL_NOT_ALLOWED');
    expect(routeSource).toContain('CHECKIN_CANCEL:success');
    expect(routeSource).toContain('CHECKIN_CANCEL:failure');
    expect(repositorySource).toContain('cancelTodayCheckin');
    expect(repositorySource).toContain('habit_logs');
    expect(repositorySource).toContain('log_date');
    expect(repositorySource).toContain('user_id');
  });

  it('keeps IF-002 error mapping contract keywords for cancel flow', () => {
    const handlerSource = requireApiRoute('src/server/api/if002-route-handler.ts');

    expect(handlerSource).toContain('CHECKIN_CANCEL_NOT_ALLOWED');
    expect(handlerSource).toContain('DOMAIN_CONFLICT');
    expect(handlerSource).toContain('FORBIDDEN');
    expect(handlerSource).toContain('VALIDATION_ERROR');
  });
});
