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
  "upgrade-insecure-requests",
];

export const securityHeaders: Readonly<Record<string, string>> = Object.freeze({
  "Content-Security-Policy": cspDirectives.join('; '),
  "X-Content-Type-Options": 'nosniff',
  "Referrer-Policy": 'strict-origin-when-cross-origin',
  "X-Frame-Options": 'DENY',
});

export function withSecurityHeaders(input: Headers): Headers {
  const headers = new Headers(input);

  for (const [name, value] of Object.entries(securityHeaders)) {
    headers.set(name, value);
  }

  return headers;
}
