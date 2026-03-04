import type { If002Method, If002RequirementId } from "./if-002-cases";

export interface If002InvalidPayloadCase {
  traceId: string;
  endpoint: "/api/habits" | "/api/habits/{id}" | "/api/settings/profile" | "/api/checkins/{habitId}";
  method: If002Method;
  requirementId: If002RequirementId;
  expectedStatus: 400;
  expectedCode: "VALIDATION_ERROR";
  expectedMessage: string;
  request: {
    actorUserId: string;
    body: Record<string, unknown>;
  };
}

export const IF002_DTO_TARGET_ENDPOINTS = [
  "/api/habits",
  "/api/habits/{id}",
  "/api/settings/profile",
  "/api/checkins/{habitId}",
] as const;

export const IF002_INVALID_PAYLOAD_CASES: If002InvalidPayloadCase[] = [
  {
    traceId: "IF-002/DTO/FR-011/habits/create-name-required",
    endpoint: "/api/habits",
    method: "POST",
    requirementId: "FR-011",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "name is required",
    request: {
      actorUserId: "user-red-001",
      body: { display_order: 100 },
    },
  },
  {
    traceId: "IF-002/DTO/FR-011/habits/create-name-over-80",
    endpoint: "/api/habits",
    method: "POST",
    requirementId: "FR-011",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "name must be 1..80 characters",
    request: {
      actorUserId: "user-red-001",
      body: { name: "a".repeat(81), display_order: 100 },
    },
  },
  {
    traceId: "IF-002/DTO/FR-011/habits/create-display-order-min",
    endpoint: "/api/habits",
    method: "POST",
    requirementId: "FR-011",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "display_order must be 1..9999",
    request: {
      actorUserId: "user-red-001",
      body: { name: "morning walk", display_order: 0 },
    },
  },
  {
    traceId: "IF-002/DTO/FR-011/habits/create-display-order-max",
    endpoint: "/api/habits",
    method: "POST",
    requirementId: "FR-011",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "display_order must be 1..9999",
    request: {
      actorUserId: "user-red-001",
      body: { name: "morning walk", display_order: 10000 },
    },
  },
  {
    traceId: "IF-002/DTO/FR-011/habits/update-name-empty",
    endpoint: "/api/habits/{id}",
    method: "PATCH",
    requirementId: "FR-011",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "name must be 1..80 characters",
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-red-001", name: "" },
    },
  },
  {
    traceId: "IF-002/DTO/FR-011/habits/update-display-order-range",
    endpoint: "/api/habits/{id}",
    method: "PATCH",
    requirementId: "FR-011",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "display_order must be 1..9999",
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-red-001", display_order: -1 },
    },
  },
  {
    traceId: "IF-002/DTO/FR-021/profile/timezone-invalid-iana",
    endpoint: "/api/settings/profile",
    method: "PATCH",
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
    traceId: "IF-002/DTO/FR-021/profile/cutoff-out-of-range",
    endpoint: "/api/settings/profile",
    method: "PATCH",
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
    traceId: "IF-002/DTO/FR-021/profile/cutoff-format-invalid",
    endpoint: "/api/settings/profile",
    method: "PATCH",
    requirementId: "FR-021",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "day_cutoff_time must be hh:mm",
    request: {
      actorUserId: "user-red-001",
      body: { timezone: "Asia/Tokyo", day_cutoff_time: "9:00" },
    },
  },
  {
    traceId: "IF-002/DTO/FR-014/checkins/cancel-habit-id-required",
    endpoint: "/api/checkins/{habitId}",
    method: "DELETE",
    requirementId: "FR-014",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "habit_id is required",
    request: {
      actorUserId: "user-red-001",
      body: { now_utc: "2026-03-12T12:00:00.000Z" },
    },
  },
  {
    traceId: "IF-002/DTO/FR-014/checkins/cancel-now-utc-required",
    endpoint: "/api/checkins/{habitId}",
    method: "DELETE",
    requirementId: "FR-014",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "now_utc is required",
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-red-001" },
    },
  },
  {
    traceId: "IF-002/DTO/FR-014/checkins/cancel-now-utc-format",
    endpoint: "/api/checkins/{habitId}",
    method: "DELETE",
    requirementId: "FR-014",
    expectedStatus: 400,
    expectedCode: "VALIDATION_ERROR",
    expectedMessage: "now_utc must be iso-8601",
    request: {
      actorUserId: "user-red-001",
      body: { habit_id: "habit-red-001", now_utc: "not-iso" },
    },
  },
];
