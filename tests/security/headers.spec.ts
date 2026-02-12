import { describe, expect, test } from 'vitest';

import { securityHeaders, withSecurityHeaders } from '../../middleware';

describe('security headers middleware template', () => {
  test('defines required security headers', () => {
    expect(securityHeaders['Content-Security-Policy']).toContain('frame-ancestors');
    expect(securityHeaders['X-Content-Type-Options']).toBe('nosniff');
    expect(securityHeaders['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
    expect(securityHeaders['X-Frame-Options']).toBe('DENY');
  });

  test('applies security headers to response headers', () => {
    const headers = withSecurityHeaders(new Headers({ 'x-test': 'value' }));

    expect(headers.get('x-test')).toBe('value');
    expect(headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
  });
});
