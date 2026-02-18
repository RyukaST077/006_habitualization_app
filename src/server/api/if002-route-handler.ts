import { domainConflict, forbidden, internalError, validationError } from './if002-errors';

type If002ErrorCode =
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INVALID_HABIT_INPUT'
  | 'CHECKIN_CANCEL_NOT_ALLOWED'
  | 'DOMAIN_CONFLICT'
  | 'INTERNAL_ERROR';

const IF002_ERROR_CODES: ReadonlySet<If002ErrorCode> = new Set([
  'FORBIDDEN',
  'VALIDATION_ERROR',
  'INVALID_HABIT_INPUT',
  'CHECKIN_CANCEL_NOT_ALLOWED',
  'DOMAIN_CONFLICT',
  'INTERNAL_ERROR',
]);

function isIf002ErrorCode(code: string): code is If002ErrorCode {
  return IF002_ERROR_CODES.has(code as If002ErrorCode);
}

function parseErrorCode(error: unknown): If002ErrorCode | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const [code] = error.message.split(':');
  if (isIf002ErrorCode(code)) {
    return code;
  }

  return null;
}

export async function handleIf002<T>(handler: () => Promise<T>): Promise<Response> {
  try {
    const response = await handler();
    return response as Response;
  } catch (error) {
    const code = parseErrorCode(error);
    switch (code) {
      case 'FORBIDDEN':
        return forbidden();
      case 'VALIDATION_ERROR':
      case 'INVALID_HABIT_INPUT':
        return validationError();
      case 'DOMAIN_CONFLICT':
      case 'CHECKIN_CANCEL_NOT_ALLOWED':
        return domainConflict();
      case 'INTERNAL_ERROR':
        return internalError();
      default:
        return internalError();
    }
  }
}
