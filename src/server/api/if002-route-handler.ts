import { domainConflict, forbidden, internalError, validationError } from './if002-errors';

export async function handleIf002<T>(handler: () => Promise<T>): Promise<Response> {
  try {
    const response = await handler();
    return response as Response;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('FORBIDDEN')) {
      return forbidden();
    }
    if (error instanceof Error && error.message.startsWith('VALIDATION_ERROR')) {
      return validationError();
    }
    if (error instanceof Error && error.message.startsWith('INVALID_HABIT_INPUT')) {
      return validationError();
    }
    if (error instanceof Error && error.message.startsWith('DOMAIN_CONFLICT')) {
      return domainConflict();
    }
    if (error instanceof Error && error.message.startsWith('INTERNAL_ERROR')) {
      return internalError();
    }
    return internalError();
  }
}
