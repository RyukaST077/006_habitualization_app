import {
  resolveAuthConsentGuard,
  type AuthConsentGuardActor,
  type ConsentDecision,
} from './src/client/routing/auth-consent-guard';

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self'",
  "connect-src 'self'",
  'upgrade-insecure-requests',
];

export const securityHeaders: Readonly<Record<string, string>> = Object.freeze({
  'Content-Security-Policy': cspDirectives.join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
});

export function withSecurityHeaders(input: Headers): Headers {
  const headers = new Headers(input);

  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }

  return headers;
}

export type GuardablePath = '/home' | '/policy-consent';

export type MiddlewareGuardResult = {
  redirectTo: '/login' | '/policy-consent' | '/home' | null;
  sessionDestroyed: boolean;
};

export function resolveMiddlewareGuard(
  pathname: string,
  actor: AuthConsentGuardActor,
  decision: ConsentDecision = 'none',
): MiddlewareGuardResult {
  if (pathname !== '/home' && pathname !== '/policy-consent') {
    return { redirectTo: null, sessionDestroyed: false };
  }

  const resolution = resolveAuthConsentGuard(actor, pathname as GuardablePath, decision);

  if (resolution.nextPath === pathname) {
    return { redirectTo: null, sessionDestroyed: false };
  }

  return {
    redirectTo: resolution.nextPath,
    sessionDestroyed: resolution.sessionDestroyed,
  };
}
