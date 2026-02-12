import { describe, expect, it } from 'vitest';

import {
  AUTH_CONSENT_GUARD_CASES,
  ROUTING_ACTORS,
  type RoutingActor,
} from '../../helpers/routing-actors';
import {
  expectGuardRedirect,
  expectGuardResolution,
} from '../../helpers/assertions';
import {
  resolveAuthConsentGuard,
  type ConsentDecision,
  type GuardResolution,
} from '../../../src/client/routing/auth-consent-guard';

type GuardFailureHint = {
  state: RoutingActor['state'];
  requestedPath: '/home' | '/policy-consent';
  expectedRedirect: GuardResolution['nextPath'];
};

function resolveGuardedTransition(
  actor: RoutingActor,
  requestedPath: '/home' | '/policy-consent',
  decision: ConsentDecision = 'none',
): GuardResolution {
  return resolveAuthConsentGuard(actor, requestedPath, decision);
}

const DIRECT_GUARD_CASES = [
  {
    title: '[TC-IT-FR-003-002][FNC-001][SCR-002->SCR-001] 未認証で/home直アクセス時に/loginへ遷移する',
    actor: ROUTING_ACTORS.UNAUTHENTICATED,
    requestedPath: '/home' as const,
    decision: 'none' as const,
    expectedPath: '/login' as const,
    expectedSessionDestroyed: false,
  },
  {
    title:
      '[TC-IT-FR-003-002][FNC-002][SCR-002->SCR-008] 認証済み未同意で/home直アクセス時に/policy-consentへ遷移する',
    actor: ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
    requestedPath: '/home' as const,
    decision: 'none' as const,
    expectedPath: '/policy-consent' as const,
    expectedSessionDestroyed: false,
  },
  {
    title: '[TC-ST-FR-004-004][FNC-002][SCR-008->SCR-001] 同意拒否時にセッション破棄して/loginへ遷移する',
    actor: ROUTING_ACTORS.AUTHENTICATED_WITHOUT_CONSENT,
    requestedPath: '/policy-consent' as const,
    decision: 'reject' as const,
    expectedPath: '/login' as const,
    expectedSessionDestroyed: true,
  },
  {
    title:
      '[TC-IT-FR-002-001][FNC-002][SCR-008->SCR-002] 同意済みで/policy-consent到達時は/homeへ遷移する',
    actor: ROUTING_ACTORS.AUTHENTICATED_WITH_CONSENT,
    requestedPath: '/policy-consent' as const,
    decision: 'none' as const,
    expectedPath: '/home' as const,
    expectedSessionDestroyed: false,
  },
];

describe('auth consent guard transitions (Green)', () => {
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

  it('keeps reusable guard expectation hints for redirects', () => {
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
      const actor = AUTH_CONSENT_GUARD_CASES.find((testCase) => testCase.actor.state === hint.state)?.actor;
      expect(actor).toBeDefined();

      const decision: ConsentDecision =
        hint.state === 'authenticated_without_consent' && hint.requestedPath === '/policy-consent'
          ? 'reject'
          : 'none';

      const result = resolveGuardedTransition(actor as RoutingActor, hint.requestedPath, decision);
      expectGuardRedirect(result.nextPath, hint.expectedRedirect);
    }
  });

  it.each(DIRECT_GUARD_CASES)('$title', ({ actor, requestedPath, decision, expectedPath, expectedSessionDestroyed }) => {
    const result = resolveGuardedTransition(actor, requestedPath, decision);
    expectGuardResolution(
      result.nextPath,
      expectedPath,
      result.sessionDestroyed,
      expectedSessionDestroyed,
    );
  });

  it('[TC-IT-FR-002-001][FNC-001/FNC-002][SCR-001->SCR-002] 同意済みならセッションを維持して/homeへ到達可能', () => {
    const result = resolveGuardedTransition(ROUTING_ACTORS.AUTHENTICATED_WITH_CONSENT, '/home');
    expectGuardResolution(result.nextPath, '/home', result.sessionDestroyed, false);
  });
});
