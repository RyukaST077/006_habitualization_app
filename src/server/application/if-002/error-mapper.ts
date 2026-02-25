import type { If002ErrorResult } from "./error-response";

type If002HandledErrorCode = "FORBIDDEN" | "DOMAIN_CONFLICT";
const FORBIDDEN_REQUIREMENT_ID = "FR-025";

const IF002_HANDLED_ERROR_STATUS: Record<If002HandledErrorCode, 403 | 409> = {
  FORBIDDEN: 403,
  DOMAIN_CONFLICT: 409,
};

export class If002HandledError extends Error {
  public readonly code: If002HandledErrorCode;
  public readonly requirementId: string;

  public constructor(code: If002HandledErrorCode, message: string, requirementId: string) {
    super(message);
    this.name = "If002HandledError";
    this.code = code;
    this.requirementId = requirementId;
  }
}

export function createIf002HandledError(
  code: If002HandledErrorCode,
  message: string,
  requirementId: string,
): If002HandledError {
  return new If002HandledError(code, message, requirementId);
}

export function mapIf002Error(error: unknown, traceId: string, fallbackRequirementId: string): If002ErrorResult {
  if (error instanceof If002HandledError) {
    const requirementId = error.code === "FORBIDDEN" ? FORBIDDEN_REQUIREMENT_ID : error.requirementId;

    return {
      status: IF002_HANDLED_ERROR_STATUS[error.code],
      body: {
        code: error.code,
        message: error.message,
        trace_id: `trace-${traceId}`,
        requirement_id: requirementId,
      },
    };
  }

  return {
    status: 500,
    body: {
      code: "INTERNAL_ERROR",
      message: "unexpected error",
      trace_id: `trace-${traceId}`,
      requirement_id: fallbackRequirementId,
    },
  };
}
