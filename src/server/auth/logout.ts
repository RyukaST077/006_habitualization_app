import { randomUUID } from 'node:crypto';

export type LogoutResult = {
  status: 200;
  logout: true;
  redirectTo: '/login';
  trace_id: string;
  auditEvent: 'LOGOUT_SUCCESS';
};

export function logout(): LogoutResult {
  return {
    status: 200,
    logout: true,
    redirectTo: '/login',
    trace_id: randomUUID(),
    auditEvent: 'LOGOUT_SUCCESS',
  };
}
