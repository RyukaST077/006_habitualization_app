export type If002Method = "POST" | "PATCH" | "DELETE";
export type If002ErrorCode =
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "DOMAIN_CONFLICT"
  | "INTERNAL_ERROR";
export type If002RequirementId = "FR-011" | "FR-012" | "FR-013" | "FR-021" | "FR-025";
export type If002Perspective = "DTO_REQUIRED" | "DTO_TYPE_RANGE" | "AUTHZ_SELF_ONLY" | "DOMAIN_STATE" | "SYSTEM";

export interface If002CaseDefinition {
  traceId: string;
  endpoint: string;
  method: If002Method;
  perspective: If002Perspective;
  requirementId: If002RequirementId;
  expectedStatus: 400 | 403 | 409 | 500;
  expectedCode: If002ErrorCode;
  expectedMessage: string;
  request: {
    actorUserId: string;
    targetUserId?: string;
    body: Record<string, unknown>;
  };
}

export const IF002_REPRESENTATIVE_ENDPOINTS = [
  "/api/habits",
  "/api/checkins",
  "/api/settings/profile",
  "/api/settings/withdrawal",
] as const;

export const IF002_REQUIRED_REQUIREMENT_IDS: If002RequirementId[] = [
  "FR-011",
  "FR-012",
  "FR-013",
  "FR-021",
  "FR-025",
];

export const IF002_REQUIRED_ERROR_STATUSES = [400, 403, 409, 500] as const;

export const IF002_RED_CASES: If002CaseDefinition[] = [
  {
    traceId: "IF-002/DTO/FR-011/checkins/habitId-required",
    endpoint: "/api/checkins",
    method: "POST",
    perspective: "DTO_REQUIRED",
    requirementId: "FR-011",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "habit_id is required",
    request: {
      actorUserId: "user-red-001",
      body: { log_date: "2026-02-23" },
    },
  },
  {
    traceId: "IF-002/DTO/FR-012/checkins/logDate-format",
    endpoint: "/api/checkins",
    method: "POST",
    perspective: "DTO_TYPE_RANGE",
    requirementId: "FR-012",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "log_date must be yyyy-mm-dd",
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-red-001", log_date: "23-02-2026" },
    },
  },
  {
    traceId: "IF-002/DOMAIN/FR-013/checkins/archived-habit",
    endpoint: "/api/checkins",
    method: "POST",
    perspective: "DOMAIN_STATE",
    requirementId: "FR-013",
    expectedStatus: 409,
    expectedCode: "DOMAIN_CONFLICT",
    expectedMessage: "archived habit cannot be checked in",
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-archived-001", log_date: "2026-02-23" },
    },
  },
  {
    traceId: "IF-002/AUTHZ/FR-025/checkins/other-user-habit",
    endpoint: "/api/checkins",
    method: "POST",
    perspective: "AUTHZ_SELF_ONLY",
    requirementId: "FR-025",
    expectedStatus: 403,
    expectedCode: "FORBIDDEN",
    expectedMessage: "access denied",
    request: {
      actorUserId: "user-red-001",
      targetUserId: "user-red-002",
      body: { habit_id: "habit-user-red-002", log_date: "2026-02-23" },
    },
  },
  {
    traceId: "IF-002/DTO/FR-021/profile/timezone",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    perspective: "DTO_TYPE_RANGE",
    requirementId: "FR-021",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "timezone is invalid",
    request: {
      actorUserId: "user-red-001",
      body: { timezone: "Mars/Olympus", day_cutoff_time: "04:00" },
    },
  },
  {
    traceId: "IF-002/DTO/FR-021/profile/cutoff-format",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    perspective: "DTO_TYPE_RANGE",
    requirementId: "FR-021",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "day_cutoff_time must be hh:mm",
    request: {
      actorUserId: "user-red-001",
      body: { timezone: "Asia/Tokyo", day_cutoff_time: "24:00" },
    },
  },
  {
    traceId: "IF-002/AUTHZ/FR-025/habits/patch-other-user",
    endpoint: "/api/habits",
    method: "PATCH",
    perspective: "AUTHZ_SELF_ONLY",
    requirementId: "FR-025",
    expectedStatus: 403,
    expectedCode: "FORBIDDEN",
    expectedMessage: "access denied",
    request: {
      actorUserId: "user-red-001",
      targetUserId: "user-red-002",
      body: { habit_id: "habit-user-red-002", name: "rename by other user", version: 2 },
    },
  },
  {
    traceId: "IF-002/AUTHZ/FR-025/withdrawal/self-only",
    endpoint: "/api/settings/withdrawal",
    method: "POST",
    perspective: "AUTHZ_SELF_ONLY",
    requirementId: "FR-025",
    expectedStatus: 403,
    expectedCode: "FORBIDDEN",
    expectedMessage: "access denied",
    request: {
      actorUserId: "user-red-001",
      targetUserId: "user-red-002",
      body: { reason: "cleanup", requested_by: "user-red-002" },
    },
  },
  {
    traceId: "IF-002/SYSTEM/FR-011/habits/create-unexpected",
    endpoint: "/api/habits",
    method: "POST",
    perspective: "SYSTEM",
    requirementId: "FR-011",
    expectedStatus: 500,
    expectedCode: "INTERNAL_ERROR",
    expectedMessage: "unexpected error",
    request: {
      actorUserId: "user-red-001",
      body: { name: "read", display_order: 10, force_throw: true },
    },
  },
  {
    traceId: "IF-002/SYSTEM/FR-025/withdrawal/internal-failure",
    endpoint: "/api/settings/withdrawal",
    method: "POST",
    perspective: "SYSTEM",
    requirementId: "FR-025",
    expectedStatus: 500,
    expectedCode: "INTERNAL_ERROR",
    expectedMessage: "unexpected error",
    request: {
      actorUserId: "user-red-001",
      body: { reason: "cleanup", force_throw: true },
    },
  },
];
