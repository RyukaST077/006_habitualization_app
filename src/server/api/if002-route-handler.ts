import { domainConflict, forbidden, internalError, validationError } from './if002-errors';

type If002ErrorCode =
  | 'FORBIDDEN'
  | 'VALIDATION_ERROR'
  | 'INVALID_HABIT_INPUT'
  | 'DOMAIN_CONFLICT'
  | 'INTERNAL_ERROR';

function parseErrorCode(error: unknown): If002ErrorCode | null {
  if (!(error instanceof Error)) {
    return null;
  }

  const [code] = error.message.split(':');
  if (
    code === 'FORBIDDEN' ||
    code === 'VALIDATION_ERROR' ||
    code === 'INVALID_HABIT_INPUT' ||
    code === 'DOMAIN_CONFLICT' ||
    code === 'INTERNAL_ERROR'
  ) {
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
        return domainConflict();
      case 'INTERNAL_ERROR':
        return internalError();
      default:
        return internalError();
    }
  }
}
