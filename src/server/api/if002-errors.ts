import { randomUUID } from 'node:crypto';

type ErrorCode =
  | 'FORBIDDEN'
  | 'DOMAIN_CONFLICT'
  | 'CHECKIN_CANCEL_NOT_ALLOWED'
  | 'INTERNAL_ERROR'
  | 'VALIDATION_ERROR';

type ErrorBody = {
  result: 'error';
  code: ErrorCode;
  trace_id: string;
};

function errorResponse(status: number, code: ErrorCode, traceId?: string): Response {
  const body: ErrorBody = {
    result: 'error',
    code,
    trace_id: traceId ?? randomUUID(),
  };

  return Response.json(body, { status });
}

export function forbidden(traceId?: string): Response {
  return errorResponse(403, 'FORBIDDEN', traceId);
}

export function domainConflict(traceId?: string): Response {
  return errorResponse(409, 'DOMAIN_CONFLICT', traceId);
}

export function checkinCancelNotAllowed(traceId?: string): Response {
  return errorResponse(409, 'CHECKIN_CANCEL_NOT_ALLOWED', traceId);
}

export function internalError(traceId?: string): Response {
  return errorResponse(500, 'INTERNAL_ERROR', traceId);
}

export function validationError(traceId?: string): Response {
  return errorResponse(400, 'VALIDATION_ERROR', traceId);
}

export function success(payload: Record<string, unknown> = {}): Response {
  return Response.json({
    result: 'success',
    trace_id: randomUUID(),
    ...payload,
  });
}
