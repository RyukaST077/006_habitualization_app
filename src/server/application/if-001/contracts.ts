export type If001StartApiStatus = 200 | 400 | 401 | 500;

export type If001StartApiErrorCode = "INVALID_REDIRECT" | "AUTH_FAILED" | "AUTH_PROVIDER_ERROR";

export type If001StartApiAuditAction = "LOGIN_START" | "LOGIN_FAILED";

export interface If001StartApiRequest {
  redirectTo?: string;
  authorization?: string;
}

export interface If001StartApiSuccessResponse {
  status: 200;
  body: {
    auth_url: string;
    trace_id: string;
    audit_action: "LOGIN_START";
  };
}

export interface If001StartApiErrorResponse {
  status: 400 | 401 | 500;
  body: {
    code: If001StartApiErrorCode;
    trace_id: string;
    route: "SCR-001";
    audit_action: "LOGIN_FAILED";
  };
}

export type If001StartApiResponse = If001StartApiSuccessResponse | If001StartApiErrorResponse;
