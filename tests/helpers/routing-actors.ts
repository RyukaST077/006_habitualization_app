import { createAuthConsentFixtures } from './fixtures';

export type RoutingActorState =
  | 'unauthenticated'
  | 'authenticated_without_consent'
  | 'authenticated_with_consent';

export type RoutingActor = {
  actorId: string;
  state: RoutingActorState;
  hasSession: boolean;
  hasConsented: boolean;
};

export type GuardTransitionCase = {
  caseId: string;
  fromScr: 'SCR-002' | 'SCR-008';
  requestedPath: '/home' | '/policy-consent';
  expectedPath: '/login' | '/policy-consent' | '/home';
  requiresSessionDestroy: boolean;
  actor: RoutingActor;
  traceability: string[];
};

export type RoutingActorSet = {
  UNAUTHENTICATED: RoutingActor;
  AUTHENTICATED_WITHOUT_CONSENT: RoutingActor;
  AUTHENTICATED_WITH_CONSENT: RoutingActor;
};

export function createRoutingActors(): RoutingActorSet {
  const fixtures = createAuthConsentFixtures();

  return {
    UNAUTHENTICATED: { ...fixtures.UNAUTHENTICATED },
    AUTHENTICATED_WITHOUT_CONSENT: { ...fixtures.AUTHENTICATED_WITHOUT_CONSENT },
    AUTHENTICATED_WITH_CONSENT: { ...fixtures.AUTHENTICATED_WITH_CONSENT },
  };
}

export function createAuthConsentGuardCases(actors: RoutingActorSet): GuardTransitionCase[] {
  return [
    {
      caseId: 'TC-IT-FR-003-002-UNAUTH-HOME',
      fromScr: 'SCR-002',
      requestedPath: '/home',
      expectedPath: '/login',
      requiresSessionDestroy: false,
      actor: actors.UNAUTHENTICATED,
      traceability: ['TC-IT-FR-003-002', 'SCR-002', 'SCR-001', 'FNC-001'],
    },
    {
      caseId: 'TC-IT-FR-003-002-UNCONSENTED-HOME',
      fromScr: 'SCR-002',
      requestedPath: '/home',
      expectedPath: '/policy-consent',
      requiresSessionDestroy: false,
      actor: actors.AUTHENTICATED_WITHOUT_CONSENT,
      traceability: ['TC-IT-FR-003-002', 'SCR-002', 'SCR-008', 'FNC-002'],
    },
    {
      caseId: 'TC-ST-FR-004-004-CONSENT-REJECT',
      fromScr: 'SCR-008',
      requestedPath: '/policy-consent',
      expectedPath: '/login',
      requiresSessionDestroy: true,
      actor: actors.AUTHENTICATED_WITHOUT_CONSENT,
      traceability: ['TC-ST-FR-004-004', 'SCR-008', 'SCR-001', 'FNC-002', 'POLICY_CONSENT_REJECT'],
    },
    {
      caseId: 'TC-IT-FR-002-001-CONSENTED-HOME',
      fromScr: 'SCR-002',
      requestedPath: '/home',
      expectedPath: '/home',
      requiresSessionDestroy: false,
      actor: actors.AUTHENTICATED_WITH_CONSENT,
      traceability: ['TC-IT-FR-002-001', 'SCR-001', 'SCR-002', 'FNC-001', 'FNC-002'],
    },
    {
      caseId: 'TC-IT-FR-002-001-CONSENTED-POLICY-CONSENT',
      fromScr: 'SCR-008',
      requestedPath: '/policy-consent',
      expectedPath: '/home',
      requiresSessionDestroy: false,
      actor: actors.AUTHENTICATED_WITH_CONSENT,
      traceability: ['TC-IT-FR-002-001', 'SCR-008', 'SCR-002', 'FNC-002'],
    },
  ];
}

export const ROUTING_ACTORS = createRoutingActors();
export const AUTH_CONSENT_GUARD_CASES: GuardTransitionCase[] =
  createAuthConsentGuardCases(ROUTING_ACTORS);
