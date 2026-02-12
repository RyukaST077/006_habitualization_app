export type GuardedPath = '/home' | '/policy-consent';
export type GuardRedirectPath = '/login' | '/policy-consent' | '/home';

export type ConsentDecision = 'none' | 'accept' | 'reject';

export type AuthConsentGuardActor = {
  hasSession: boolean;
  hasConsented: boolean;
};

export type GuardResolution = {
  nextPath: GuardRedirectPath;
  sessionDestroyed: boolean;
};

export function resolveAuthConsentGuard(
  actor: AuthConsentGuardActor,
  requestedPath: GuardedPath,
  decision: ConsentDecision = 'none',
): GuardResolution {
  if (!actor.hasSession) {
    return {
      nextPath: '/login',
      sessionDestroyed: false,
    };
  }

  if (requestedPath === '/home') {
    if (!actor.hasConsented) {
      return {
        nextPath: '/policy-consent',
        sessionDestroyed: false,
      };
    }

    return {
      nextPath: '/home',
      sessionDestroyed: false,
    };
  }

  if (actor.hasConsented || decision === 'accept') {
    return {
      nextPath: '/home',
      sessionDestroyed: false,
    };
  }

  if (decision === 'reject') {
    return {
      nextPath: '/login',
      sessionDestroyed: true,
    };
  }

  return {
    nextPath: '/policy-consent',
    sessionDestroyed: false,
  };
}
