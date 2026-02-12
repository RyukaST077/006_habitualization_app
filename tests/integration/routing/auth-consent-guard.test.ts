import { describe, expect, it } from 'vitest';

import {
  AUTH_CONSENT_GUARD_CASES,
  ROUTING_ACTORS,
  type RoutingActor,
} from '../../helpers/routing-actors';

type GuardResolution = {
  nextPath: '/login' | '/policy-consent' | '/home';
  sessionDestroyed: boolean;
};

function resolveGuardedTransition(
  _actor: RoutingActor,
  _requestedPath: '/home' | '/policy-consent',
  _decision: 'none' | 'accept' | 'reject' = 'none',
): GuardResolution {
  throw new Error('Auth/consent guard transition resolver is not implemented yet');
}

describe('auth consent guard transitions (Red)', () => {
  it('defines observable guard expectations: unauthenticated/unconsented cannot reach /home', () => {
    const deniedHomeActors = AUTH_CONSENT_GUARD_CASES.filter(
      (transitionCase) =>
        transitionCase.requestedPath === '/home' && transitionCase.expectedPath !== '/home',
    );

    expect(deniedHomeActors.length).toBeGreaterThanOrEqual(2);
    expect(deniedHomeActors.map((transitionCase) => transitionCase.actor.state)).toEqual(
      expect.arrayContaining(['unauthenticated', 'authenticated_without_consent']),
    );
  });

  it('test names/traceability include TC-IT-FR-003-002 and TC-ST-FR-004-004', () => {
    const tags = AUTH_CONSENT_GUARD_CASES.flatMap((transitionCase) => transitionCase.traceability);

    expect(tags).toContain('TC-IT-FR-003-002');
    expect(tags).toContain('TC-ST-FR-004-004');
  });

  it('[TC-IT-FR-003-002] 未認証で/home直アクセス時に/loginへ遷移する', () => {
    const result = resolveGuardedTransition(ROUTING_ACTORS.UNAUTHENTICATED, '/home');
    expect(result.nextPath).toBe('/login');
    expect(result.sessionDestroyed).toBe(false);
  });

  it('[TC-IT-FR-003-002] 認証済み未同意で/home直アクセス時に/policy-consentへ遷移する', () => {
    const result = resolveGuardedTransition(
      ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
      '/home',
    );
    expect(result.nextPath).toBe('/policy-consent');
    expect(result.sessionDestroyed).toBe(false);
  });

  it('[TC-ST-FR-004-004] 同意拒否時にセッション破棄して/loginへ遷移する', () => {
    const result = resolveGuardedTransition(
      ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
      '/policy-consent',
      'reject',
    );
    expect(result.nextPath).toBe('/login');
    expect(result.sessionDestroyed).toBe(true);
  });
});
