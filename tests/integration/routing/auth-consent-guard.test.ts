import { describe, expect, it } from 'vitest';

import {
  AUTH_CONSENT_GUARD_CASES,
  ROUTING_ACTORS,
  type RoutingActor,
} from '../../helpers/routing-actors';
import {
  expectGuardFailureReason,
  expectGuardRedirect,
  expectSessionDestroyed,
} from '../../helpers/assertions';

type GuardResolution = {
  nextPath: '/login' | '/policy-consent' | '/home';
  sessionDestroyed: boolean;
};

type GuardFailureHint = {
  state: RoutingActor['state'];
  requestedPath: '/home' | '/policy-consent';
  expectedRedirect: GuardResolution['nextPath'];
};

function resolveGuardedTransition(
  actor: RoutingActor,
  requestedPath: '/home' | '/policy-consent',
  decision: 'none' | 'accept' | 'reject' = 'none',
): GuardResolution {
  if (!actor.hasSession && requestedPath === '/home') {
    throw new Error('Guard not implemented: expected redirect to /login for unauthenticated /home access');
  }

  if (actor.hasSession && !actor.hasConsented && requestedPath === '/home') {
    throw new Error(
      'Guard not implemented: expected redirect to /policy-consent for unconsented /home access',
    );
  }

  if (actor.hasSession && !actor.hasConsented && requestedPath === '/policy-consent' && decision === 'reject') {
    throw new Error('Guard not implemented: expected redirect to /login after consent rejection');
  }

  if (actor.hasSession && actor.hasConsented && requestedPath === '/policy-consent') {
    throw new Error(
      'Guard not implemented: expected redirect to /home when consented user reaches /policy-consent',
    );
  }

  throw new Error('Guard not implemented: no transition rule for this case');
}

function expectResolvedGuard(result: GuardResolution, expectedPath: GuardResolution['nextPath'], sessionDestroyed: boolean): void {
  expectGuardRedirect(result.nextPath, expectedPath);
  expectSessionDestroyed(result.sessionDestroyed, sessionDestroyed);
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

  it('contains all actor states: unauthenticated / without consent / with consent', () => {
    const actorStates = new Set(AUTH_CONSENT_GUARD_CASES.map((transitionCase) => transitionCase.actor.state));

    expect(actorStates).toEqual(
      new Set([
        'unauthenticated',
        'authenticated_without_consent',
        'authenticated_with_consent',
      ]),
    );
  });

  it('test names/traceability include FNC-001/FNC-002, SCR-001/002/008 and TC-* IDs', () => {
    const tags = AUTH_CONSENT_GUARD_CASES.flatMap((transitionCase) => transitionCase.traceability);

    expect(tags).toContain('FNC-001');
    expect(tags).toContain('FNC-002');
    expect(tags).toContain('SCR-001');
    expect(tags).toContain('SCR-002');
    expect(tags).toContain('SCR-008');
    expect(tags).toContain('TC-IT-FR-002-001');
    expect(tags).toContain('TC-IT-FR-003-002');
    expect(tags).toContain('TC-ST-FR-004-004');
    expect(tags).toContain('POLICY_CONSENT_REJECT');
  });

  it('keeps reusable guard failure reason hints for expected redirects', () => {
    const failureHints: GuardFailureHint[] = [
      { state: 'unauthenticated', requestedPath: '/home', expectedRedirect: '/login' },
      {
        state: 'authenticated_without_consent',
        requestedPath: '/home',
        expectedRedirect: '/policy-consent',
      },
      {
        state: 'authenticated_without_consent',
        requestedPath: '/policy-consent',
        expectedRedirect: '/login',
      },
      {
        state: 'authenticated_with_consent',
        requestedPath: '/policy-consent',
        expectedRedirect: '/home',
      },
    ];

    for (const hint of failureHints) {
      expectGuardFailureReason(
        `Guard not implemented: expected redirect to ${hint.expectedRedirect}`,
        hint.expectedRedirect,
      );
    }
  });

  it('[TC-IT-FR-003-002][FNC-001][SCR-002->SCR-001] 未認証で/home直アクセス時に/loginへ遷移する', () => {
    const result = resolveGuardedTransition(ROUTING_ACTORS.UNAUTHENTICATED, '/home');
    expectResolvedGuard(result, '/login', false);
  });

  it('[TC-IT-FR-003-002][FNC-002][SCR-002->SCR-008] 認証済み未同意で/home直アクセス時に/policy-consentへ遷移する', () => {
    const result = resolveGuardedTransition(
      ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
      '/home',
    );
    expectResolvedGuard(result, '/policy-consent', false);
  });

  it('[TC-ST-FR-004-004][FNC-002][SCR-008->SCR-001] 同意拒否時にセッション破棄して/loginへ遷移する', () => {
    const result = resolveGuardedTransition(
      ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
      '/policy-consent',
      'reject',
    );
    expectResolvedGuard(result, '/login', true);
  });

  it('[TC-IT-FR-002-001][FNC-001/FNC-002][SCR-001->SCR-002] 同意済みなら/homeへ到達可能', () => {
    const consentedHomeCase = AUTH_CONSENT_GUARD_CASES.find(
      (transitionCase) => transitionCase.caseId === 'TC-IT-FR-002-001-CONSENTED-HOME',
    );

    expect(consentedHomeCase).toBeDefined();
    expect(consentedHomeCase?.expectedPath).toBe('/home');
  });

  it('[TC-IT-FR-002-001][FNC-002][SCR-008->SCR-002] 同意済みで/policy-consent到達時は/homeへ遷移する', () => {
    const result = resolveGuardedTransition(ROUTING_ACTORS.AUTHENTICATED_WITH_CONSENT, '/policy-consent');
    expectResolvedGuard(result, '/home', false);
  });
});
