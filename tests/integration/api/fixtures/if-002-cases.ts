export type If002Method = "POST" | "PATCH" | "DELETE";
export type HabitStatus = "active" | "archived";
export type HabitStatusTransitionAction = "archive" | "resume";
export type If002ErrorCode =
  | "VALIDATION_ERROR"
  | "FORBIDDEN"
  | "DOMAIN_CONFLICT"
  | "INTERNAL_ERROR";
export type If002RequirementId =
  | "FR-010"
  | "FR-006"
  | "FR-007"
  | "FR-008"
  | "FR-009"
  | "FR-011"
  | "FR-012"
  | "FR-013"
  | "FR-021"
  | "FR-025";
export type If002Perspective = "DTO_REQUIRED" | "DTO_TYPE_RANGE" | "AUTHZ_SELF_ONLY" | "DOMAIN_STATE" | "SYSTEM";
export type If002HabitLifecycleAcceptanceId = "AC-006" | "AC-007" | "AC-008" | "AC-009";
export type If002HabitTransitionRequirementId = "FR-008" | "FR-009";
export type If002CheckinsBusinessDateAcceptanceId = "AC-010";

export interface If002RunnableCase {
  traceId: string;
  endpoint: string;
  method: If002Method;
  requirementId: If002RequirementId;
  expectedMessage: string;
  request: {
    actorUserId: string;
    targetUserId?: string;
    body: Record<string, unknown>;
  };
}

export interface HabitStatusTransitionVocabulary {
  action: HabitStatusTransitionAction;
  fromStatus: HabitStatus;
  toStatus: HabitStatus;
  requirementId: If002HabitTransitionRequirementId;
  acceptanceId: "AC-008" | "AC-009";
}

export interface If002HabitLifecycleCase {
  traceId: string;
  endpoint: "/api/habits" | "/api/habits/{id}" | "/api/habits/{id}/archive" | "/api/habits/{id}/resume";
  method: "POST" | "PATCH";
  requirementId: If002RequirementId;
  acceptanceId: If002HabitLifecycleAcceptanceId;
  expectedStatus: 200 | 201 | 403;
  expectedCode?: "FORBIDDEN" | "VALIDATION_ERROR";
  expectedHabitStatus?: "active" | "archived";
  request: {
    actorUserId: string;
    targetUserId?: string;
    body: Record<string, unknown>;
  };
  transition?: HabitStatusTransitionVocabulary;
}

export interface If002HabitStatusTransitionCase extends HabitStatusTransitionVocabulary {
  traceId: string;
  endpoint: "/api/habits/{id}/archive" | "/api/habits/{id}/resume";
  method: "POST";
  expectedStatus: 200;
  request: {
    actorUserId: string;
    body: Record<string, unknown>;
  };
}

export interface If002CaseDefinition extends If002RunnableCase {
  perspective: If002Perspective;
  expectedStatus: 400 | 403 | 409 | 500;
  expectedCode: If002ErrorCode;
}

export interface If002CheckinsBusinessDateActorCase {
  actorLabel: "USER-A" | "USER-B";
  actorUserId: string;
  timezone: "Asia/Tokyo" | "UTC";
  dayCutoffTime: string;
  expectedLogDate: string;
}

export interface If002CheckinsBusinessDateRedCase {
  traceId: string;
  endpoint: "/api/checkins";
  method: "POST";
  requirementId: "FR-010";
  acceptanceId: If002CheckinsBusinessDateAcceptanceId;
  nowUtc: string;
  actors: readonly [If002CheckinsBusinessDateActorCase, If002CheckinsBusinessDateActorCase];
  request: {
    habitId: string;
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

export const IF002_HABIT_STATUS_TRANSITION_VOCABULARY: readonly HabitStatusTransitionVocabulary[] = [
  {
    action: "archive",
    fromStatus: "active",
    toStatus: "archived",
    requirementId: "FR-008",
    acceptanceId: "AC-008",
  },
  {
    action: "resume",
    fromStatus: "archived",
    toStatus: "active",
    requirementId: "FR-009",
    acceptanceId: "AC-009",
  },
] as const;

export const IF002_HABIT_STATUS_TRANSITION_CASES: readonly If002HabitStatusTransitionCase[] = [
  {
    traceId: "IF-002/HABITS/AC-008/FR-008/archive-status-transition",
    endpoint: "/api/habits/{id}/archive",
    method: "POST",
    expectedStatus: 200,
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-red-001", version: 1 },
    },
    ...IF002_HABIT_STATUS_TRANSITION_VOCABULARY[0],
  },
  {
    traceId: "IF-002/HABITS/AC-009/FR-009/resume-status-transition",
    endpoint: "/api/habits/{id}/resume",
    method: "POST",
    expectedStatus: 200,
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-archived-001", version: 3 },
    },
    ...IF002_HABIT_STATUS_TRANSITION_VOCABULARY[1],
  },
] as const;

export const IF002_HABIT_LIFECYCLE_RED_CASES: If002HabitLifecycleCase[] = [
  {
    traceId: "IF-002/HABITS/AC-006/FR-006/create-active-with-required-fields",
    endpoint: "/api/habits",
    method: "POST",
    requirementId: "FR-006",
    acceptanceId: "AC-006",
    expectedStatus: 201,
    expectedHabitStatus: "active",
    request: {
      actorUserId: "user-red-001",
      body: { name: "Morning Run", display_order: 10 },
    },
  },
  {
    traceId: "IF-002/HABITS/AC-007/FR-025/update-other-user-forbidden",
    endpoint: "/api/habits/{id}",
    method: "PATCH",
    requirementId: "FR-025",
    acceptanceId: "AC-007",
    expectedStatus: 403,
    expectedCode: "FORBIDDEN",
    request: {
      actorUserId: "user-red-001",
      targetUserId: "user-red-002",
      body: { habit_id: "habit-user-red-002", name: "rename by other user", version: 2 },
    },
  },
  ...IF002_HABIT_STATUS_TRANSITION_CASES.map((testCase) => ({
    traceId: testCase.traceId,
    endpoint: testCase.endpoint,
    method: testCase.method,
    requirementId: testCase.requirementId,
    acceptanceId: testCase.acceptanceId,
    expectedStatus: testCase.expectedStatus,
    expectedHabitStatus: testCase.toStatus,
    request: testCase.request,
    transition: {
      action: testCase.action,
      fromStatus: testCase.fromStatus,
      toStatus: testCase.toStatus,
      requirementId: testCase.requirementId,
      acceptanceId: testCase.acceptanceId,
    },
  })),
];

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

export const IF002_CHECKINS_BUSINESS_DATE_RED_CASES: readonly If002CheckinsBusinessDateRedCase[] = [
  {
    traceId: "IF-002/CHECKINS/AC-010/FR-010/business-date-by-timezone-cutoff",
    endpoint: "/api/checkins",
    method: "POST",
    requirementId: "FR-010",
    acceptanceId: "AC-010",
    nowUtc: "2026-03-01T18:00:00Z",
    actors: [
      {
        actorLabel: "USER-A",
        actorUserId: "user-red-001",
        timezone: "Asia/Tokyo",
        dayCutoffTime: "03:00",
        expectedLogDate: "2026-03-02",
      },
      {
        actorLabel: "USER-B",
        actorUserId: "user-red-002",
        timezone: "UTC",
        dayCutoffTime: "03:00",
        expectedLogDate: "2026-03-01",
      },
    ],
    request: {
      habitId: "habit-red-001",
    },
  },
] as const;
