import type { If002ValidationError } from "./dto-schemas";
import { normalizeTraceId } from "../common/trace-id";

export interface If002ErrorResponse {
  code: string;
  message: string;
  trace_id: string;
  requirement_id: string;
}

export interface If002ErrorResult {
  status: number;
  body: If002ErrorResponse;
}

export function createValidationErrorResult(
  validationError: If002ValidationError,
  traceId: string,
): If002ErrorResult {
  return {
    status: 400,
    body: {
      code: "VALIDATION_ERROR",
      message: validationError.message,
      trace_id: normalizeTraceId(traceId),
      requirement_id: validationError.requirement_id,
    },
  };
}
