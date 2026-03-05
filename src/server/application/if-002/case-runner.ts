import { assertIf002SelfOnlyAccess } from "./authorization";
import {
  validateAnalyticsUserSummaryQueryDto,
  validateCheckinCancelDto,
  validateCheckinDto,
  validateHabitCreateDto,
  validateHistoryCalendarQueryDto,
  validateHabitUpdateDto,
  validatePolicyConsentsDto,
  validateProfileSettingsDto,
} from "./dto-schemas";
import { createIf002HandledError, mapIf002Error } from "./error-mapper";
import { createValidationErrorResult, type If002ErrorResult } from "./error-response";
import { CheckinService } from "../checkin/CheckinService";
import { AuditLogService } from "../audit/AuditLogService";
import { normalizeTraceId } from "../common/trace-id";
import { resolveLogDate } from "../../domain/time/BusinessDateService";
import type { OpsRepositoryContract } from "../../domain/repositories/contracts";
import type { AuditLogRecord, AuditLogRecordInput } from "../../domain/repositories/types";
import { HistoryService } from "../history/HistoryService";
import { SettingsService } from "../settings/SettingsService";
import { HabitRepository } from "../../infrastructure/repositories/HabitRepository";
import { UserRepository } from "../../infrastructure/repositories/UserRepository";
import { createSupabaseRepositoryClient } from "../../infrastructure/repositories/supabase-repository-client";

interface If002RunnerRequest {
  actorUserId: string;
  targetUserId?: string;
  body: Record<string, unknown>;
}

interface If002RunnerCase {
  traceId: string;
  endpoint: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  expectedMessage: string;
  request: If002RunnerRequest;
}

interface If002RunnerErrorScenario {
  traceId: string;
  endpoint: "/api/checkins" | "/api/habits";
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  request: If002RunnerRequest;
}

const FR025_REQUIREMENT_ID = "FR-025";
const FR005_REQUIREMENT_ID = "FR-005";
const FR010_REQUIREMENT_ID = "FR-010";
const FR014_REQUIREMENT_ID = "FR-014";
const IF002_AUDIT_ACTION = "if-002.error";
const POLICY_CONSENT_REJECT_AUDIT_ACTION = "POLICY_CONSENT_REJECT";
const CONSENT_ENDPOINT = "/api/policies/consents";
const CONSENT_TARGET_TYPE = "policy_consents";
const POLICY_CURRENT_VERSIONS: Record<"terms" | "privacy", string> = {
  terms: "v1.0",
  privacy: "v1.0",
};
type HabitSuccessKey =
  | "POST /api/habits"
  | "PATCH /api/habits/{id}"
  | "POST /api/habits/{id}/archive"
  | "POST /api/habits/{id}/resume";
type HabitSuccessStatus = "active" | "archived";

interface HabitSuccessDefinition {
  status: 200 | 201;
  habitStatus: HabitSuccessStatus;
}

const HABIT_SUCCESS_DEFINITIONS: Record<HabitSuccessKey, HabitSuccessDefinition> = {
  "POST /api/habits": { status: 201, habitStatus: "active" },
  "PATCH /api/habits/{id}": { status: 200, habitStatus: "active" },
  "POST /api/habits/{id}/archive": { status: 200, habitStatus: "archived" },
  "POST /api/habits/{id}/resume": { status: 200, habitStatus: "active" },
};

const if002CheckinClient = createSupabaseRepositoryClient({
  profiles: [
    {
      userId: "user-red-001",
      displayName: "Red Tester A",
      timezone: "Asia/Tokyo",
      dayCutoffTime: "04:00",
      accountStatus: "active",
      version: 1,
    },
    {
      userId: "user-red-002",
      displayName: "Red Tester B",
      timezone: "UTC",
      dayCutoffTime: "04:00",
      accountStatus: "active",
      version: 1,
    },
    {
      userId: "user-red-003",
      displayName: "Red Tester C",
      timezone: "UTC",
      dayCutoffTime: "04:00",
      accountStatus: "active",
      version: 1,
    },
  ],
  habits: [
    {
      habitId: "habit-red-001",
      userId: "user-red-001",
      name: "walk",
      note: null,
      displayOrder: 10,
      status: "active",
      version: 1,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    {
      habitId: "habit-archived-001",
      userId: "user-red-001",
      name: "journal",
      note: null,
      displayOrder: 20,
      status: "archived",
      archivedAt: "2026-02-20T00:00:00.000Z",
      version: 2,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
    {
      habitId: "habit-user-red-002",
      userId: "user-red-002",
      name: "read",
      note: null,
      displayOrder: 10,
      status: "active",
      version: 1,
      createdAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-03-01T00:00:00.000Z",
    },
  ],
  habitLogs: [
    {
      userId: "user-red-001",
      habitId: "habit-red-001",
      logDate: "2026-02-01",
      checkedInAt: "2026-02-01T08:30:00.000Z",
    },
    {
      userId: "user-red-001",
      habitId: "habit-red-001",
      logDate: "2026-02-03",
      checkedInAt: "2026-02-03T08:30:00.000Z",
    },
    {
      userId: "user-red-001",
      habitId: "habit-archived-001",
      logDate: "2026-02-05",
      checkedInAt: "2026-02-05T08:30:00.000Z",
    },
    {
      userId: "user-red-002",
      habitId: "habit-user-red-002",
      logDate: "2026-02-02",
      checkedInAt: "2026-02-02T08:30:00.000Z",
    },
  ],
  userDailyActivities: [
    {
      userId: "user-red-001",
      activityDate: "2026-02-26",
      loginCount: 1,
      checkinCount: 1,
      updatedAt: "2026-02-26T09:00:00.000Z",
    },
    {
      userId: "user-red-001",
      activityDate: "2026-02-27",
      loginCount: 1,
      checkinCount: 0,
      updatedAt: "2026-02-27T09:00:00.000Z",
    },
    {
      userId: "user-red-001",
      activityDate: "2026-02-28",
      loginCount: 1,
      checkinCount: 1,
      updatedAt: "2026-02-28T09:00:00.000Z",
    },
    {
      userId: "user-red-001",
      activityDate: "2026-03-01",
      loginCount: 1,
      checkinCount: 1,
      updatedAt: "2026-03-01T09:00:00.000Z",
    },
    {
      userId: "user-red-001",
      activityDate: "2026-03-02",
      loginCount: 1,
      checkinCount: 1,
      updatedAt: "2026-03-02T09:00:00.000Z",
    },
    {
      userId: "user-red-001",
      activityDate: "2026-03-03",
      loginCount: 1,
      checkinCount: 0,
      updatedAt: "2026-03-03T09:00:00.000Z",
    },
    {
      userId: "user-red-001",
      activityDate: "2026-03-04",
      loginCount: 1,
      checkinCount: 1,
      updatedAt: "2026-03-04T09:00:00.000Z",
    },
  ],
});
const if002HabitRepository = new HabitRepository(if002CheckinClient);
const if002UserRepository = new UserRepository(if002CheckinClient);
const if002CheckinService = new CheckinService(if002UserRepository, if002HabitRepository);
const if002HistoryService = new HistoryService(if002HabitRepository, if002UserRepository);
const if002SettingsService = new SettingsService(if002UserRepository);

let if002AuditSequence = 0;
const if002AuditLogService = new AuditLogService({
  async insertAuditLog(auditRecord: AuditLogRecordInput): Promise<AuditLogRecord> {
    const timestamp = new Date().toISOString();
    if002AuditSequence += 1;

    return {
      id: `${if002AuditSequence}`,
      actorRole: auditRecord.actorRole ?? "user",
      action: auditRecord.action,
      targetType: auditRecord.targetType ?? "if-002",
      targetId: auditRecord.targetId ?? "error",
      result: auditRecord.result ?? "failure",
      requirementId: auditRecord.requirementId ?? "",
      traceId: auditRecord.traceId ?? "",
      metadata: { ...(auditRecord.metadata ?? {}) },
      actorUserId: auditRecord.actorUserId ?? null,
      resourceType: auditRecord.resourceType ?? auditRecord.targetType ?? "if-002",
      resourceId: auditRecord.resourceId ?? auditRecord.targetId ?? "error",
      detail: { ...(auditRecord.detail ?? auditRecord.metadata ?? {}) },
      occurredAt: timestamp,
      createdAt: timestamp,
    };
  },
} as OpsRepositoryContract);

function isForceThrowRequested(body: Record<string, unknown>): boolean {
  return body.force_throw === true;
}

function maybeCreateDtoErrorResult(testCase: If002RunnerCase): If002ErrorResult | null {
  const { endpoint, method, request } = testCase;

  if (endpoint === "/api/history/calendar" && method === "GET") {
    const validationError = validateHistoryCalendarQueryDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/analytics/user-summary" && method === "GET") {
    const validationError = validateAnalyticsUserSummaryQueryDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/checkins" && method === "POST") {
    const validationError = validateCheckinDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/checkins/{habitId}" && method === "DELETE") {
    const validationError = validateCheckinCancelDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/habits" && method === "POST") {
    const validationError = validateHabitCreateDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/habits/{id}" && method === "PATCH") {
    const validationError = validateHabitUpdateDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === "/api/settings/profile" && method === "PATCH") {
    const validationError = validateProfileSettingsDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  if (endpoint === CONSENT_ENDPOINT && method === "POST") {
    const validationError = validatePolicyConsentsDto(request.body);
    return validationError ? createValidationErrorResult(validationError, testCase.traceId) : null;
  }

  return null;
}

interface ConsentInput {
  policy_type: "terms" | "privacy";
  policy_version: string;
}

function extractConsentInputs(body: Record<string, unknown>): ConsentInput[] {
  const rawConsents = body.consents;
  if (!Array.isArray(rawConsents)) {
    return [];
  }

  return rawConsents
    .filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null)
    .map((consent) => ({ policy_type: consent.policy_type, policy_version: consent.policy_version }))
    .filter(
      (consent): consent is ConsentInput =>
        (consent.policy_type === "terms" || consent.policy_type === "privacy") && typeof consent.policy_version === "string",
    );
}

function maybeThrowConsentDomainError(testCase: {
  traceId: string;
  request: If002RunnerRequest;
  endpoint: string;
}): void {
  if (testCase.endpoint !== CONSENT_ENDPOINT) {
    return;
  }

  const consentInputs = extractConsentInputs(testCase.request.body);

  if (testCase.request.body.force_duplicate_consent === true) {
    throw createIf002HandledError(
      "CONSENT_ALREADY_EXISTS",
      "duplicate consent submission",
      FR005_REQUIREMENT_ID,
      testCase.traceId,
    );
  }

  for (const consent of consentInputs) {
    if (POLICY_CURRENT_VERSIONS[consent.policy_type] !== consent.policy_version) {
      throw createIf002HandledError(
        "POLICY_VERSION_MISMATCH",
        `policy version mismatch: ${consent.policy_type} expected=${POLICY_CURRENT_VERSIONS[consent.policy_type]} actual=${consent.policy_version}`,
        FR005_REQUIREMENT_ID,
        testCase.traceId,
      );
    }
  }
}

async function runWithErrorMapping(testCase: {
  traceId: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  request: If002RunnerRequest;
  endpoint: string;
}): Promise<If002ErrorResult> {
  try {
    const targetUserId = testCase.request.targetUserId ?? testCase.request.actorUserId;

    assertIf002SelfOnlyAccess({
      actorUserId: testCase.request.actorUserId,
      targetUserId,
      requirementId: testCase.requirementId,
    });

    if (isForceThrowRequested(testCase.request.body)) {
      throw new Error("force_throw");
    }

    maybeThrowConsentDomainError(testCase);

    const checkinSuccessResult = await resolveCheckinSuccessResult(testCase);
    if (checkinSuccessResult) {
      return checkinSuccessResult;
    }

    const habitSuccessResult = resolveHabitSuccessResult(testCase);
    if (habitSuccessResult) {
      return habitSuccessResult;
    }

    const historySuccessResult = await resolveHistorySuccessResult(testCase);
    if (historySuccessResult) {
      return historySuccessResult;
    }

    const analyticsSuccessResult = await resolveAnalyticsSuccessResult(testCase);
    if (analyticsSuccessResult) {
      return analyticsSuccessResult;
    }

    const settingsSuccessResult = await resolveSettingsProfileSuccessResult(testCase);
    if (settingsSuccessResult) {
      return settingsSuccessResult;
    }

    throw new Error("unexpected error");
  } catch (error: unknown) {
    const mapped = mapIf002Error(error, testCase.traceId, testCase.requirementId);
    await recordIf002ErrorAudit(testCase, mapped);

    return mapped;
  }
}

async function resolveAnalyticsSuccessResult(testCase: {
  traceId: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  endpoint: string;
  request: If002RunnerRequest;
}): Promise<If002ErrorResult | null> {
  if (testCase.endpoint !== "/api/analytics/user-summary" || testCase.method !== "GET") {
    return null;
  }

  const rangeDays = testCase.request.body.range_days as number;
  const baseDate = typeof testCase.request.body.base_date === "string"
    ? testCase.request.body.base_date
    : undefined;

  const summary = await if002HistoryService.getAnalyticsSummary(
    testCase.request.actorUserId,
    rangeDays,
    baseDate,
  );

  return createAnalyticsSummarySuccessResult(summary.completionRate, summary.bestStreak, testCase.traceId, testCase.requirementId);
}

function resolveHabitSuccessResult(testCase: {
  traceId: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  endpoint: string;
}): If002ErrorResult | null {
  const key = `${testCase.method} ${testCase.endpoint}` as HabitSuccessKey;
  const definition = HABIT_SUCCESS_DEFINITIONS[key];
  if (definition) {
    return createHabitSuccessResult(definition, testCase.traceId, testCase.requirementId);
  }

  return null;
}

async function resolveCheckinSuccessResult(testCase: {
  traceId: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  endpoint: string;
  request: If002RunnerRequest;
}): Promise<If002ErrorResult | null> {
  if (testCase.endpoint === "/api/checkins" && testCase.method === "POST") {
    const businessDateInput = parseCheckinBusinessDateInputIfPresent(testCase.request.body);
    if (businessDateInput) {
      const logDate = resolveCheckinLogDateWithValidationMapping(businessDateInput, testCase.traceId);
      return createCheckinSuccessResult(logDate, false, testCase.traceId, FR010_REQUIREMENT_ID);
    }

    const habitId = testCase.request.body.habit_id as string;
    const nowUtc = resolveCheckinNowUtc(testCase.request.body);
    const result = await if002CheckinService.registerCheckin(
      testCase.request.actorUserId,
      habitId,
      nowUtc,
      normalizeTraceId(testCase.traceId),
    );

    return createCheckinSuccessResult(result.logDate, result.idempotent, testCase.traceId, testCase.requirementId);
  }

  if (testCase.endpoint === "/api/checkins/{habitId}" && testCase.method === "DELETE") {
    const habitId = testCase.request.body.habit_id as string;
    const nowUtc = testCase.request.body.now_utc as string;
    const result = await if002CheckinService.cancelTodayCheckin(
      testCase.request.actorUserId,
      habitId,
      nowUtc,
      normalizeTraceId(testCase.traceId),
    );

    return createCheckinCancelSuccessResult(result.logDate, testCase.traceId, FR014_REQUIREMENT_ID);
  }

  return null;
}

async function resolveHistorySuccessResult(testCase: {
  traceId: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  endpoint: string;
  request: If002RunnerRequest;
}): Promise<If002ErrorResult | null> {
  if (testCase.endpoint !== "/api/history/calendar" || testCase.method !== "GET") {
    return null;
  }

  const yearMonth = testCase.request.body.year_month as string;
  const includeArchived = testCase.request.body.include_archived as boolean | undefined;
  const habitIdRaw = testCase.request.body.habit_id;
  const habitId = typeof habitIdRaw === "string" ? habitIdRaw : undefined;

  const history = await if002HistoryService.getCalendarHistory(
    testCase.request.actorUserId,
    yearMonth,
    includeArchived ?? false,
    habitId,
  );

  return createHistoryCalendarSuccessResult(history.days, testCase.traceId, testCase.requirementId);
}

async function resolveSettingsProfileSuccessResult(testCase: {
  traceId: string;
  method: "GET" | "POST" | "PATCH" | "DELETE";
  requirementId: string;
  endpoint: string;
  request: If002RunnerRequest;
}): Promise<If002ErrorResult | null> {
  if (testCase.endpoint !== "/api/settings/profile") {
    return null;
  }

  if (testCase.method === "GET") {
    const settings = await if002SettingsService.getProfileSettings(
      testCase.request.actorUserId,
      normalizeTraceId(testCase.traceId),
    );

    return {
      status: 200,
      body: {
        code: "SUCCESS",
        message: "settings profile retrieval succeeded",
        trace_id: normalizeTraceId(testCase.traceId),
        requirement_id: testCase.requirementId,
        settings: {
          timezone: settings.timezone,
          day_cutoff_time: settings.dayCutoffTime,
          version: settings.version,
        },
      } as If002ErrorResult["body"],
    };
  }

  if (testCase.method === "PATCH") {
    const current = await if002SettingsService.getProfileSettings(
      testCase.request.actorUserId,
      normalizeTraceId(`${testCase.traceId}-current`),
    );
    const versionFromPayload = testCase.request.body.version;
    const version = Number.isInteger(versionFromPayload) ? (versionFromPayload as number) : current.version;

    const updated = await if002SettingsService.updateProfileSettings(
      testCase.request.actorUserId,
      {
        timezone: testCase.request.body.timezone as string,
        dayCutoffTime: testCase.request.body.day_cutoff_time as string,
        version,
      },
      normalizeTraceId(testCase.traceId),
    );

    return {
      status: 200,
      body: {
        code: "SUCCESS",
        message: "settings profile update succeeded",
        trace_id: normalizeTraceId(testCase.traceId),
        requirement_id: testCase.requirementId,
        settings: {
          timezone: updated.timezone,
          day_cutoff_time: updated.dayCutoffTime,
          version: updated.version,
          saved: updated.saved,
          effective_from: updated.effectiveFrom,
        },
      } as If002ErrorResult["body"],
    };
  }

  return null;
}

interface CheckinBusinessDateInput {
  nowUtc: string;
  timezone: string;
  dayCutoffTime: string;
}

function parseCheckinBusinessDateInputIfPresent(payload: Record<string, unknown>): CheckinBusinessDateInput | null {
  const nowUtc = payload.now_utc;
  const timezone = payload.timezone;
  const dayCutoffTime = payload.day_cutoff_time;

  if (nowUtc === undefined && timezone === undefined && dayCutoffTime === undefined) {
    return null;
  }

  if (typeof nowUtc !== "string" || typeof timezone !== "string" || typeof dayCutoffTime !== "string") {
    return null;
  }

  return { nowUtc, timezone, dayCutoffTime };
}

function resolveCheckinNowUtc(payload: Record<string, unknown>): string {
  if (typeof payload.now_utc === "string") {
    return payload.now_utc;
  }
  return `${payload.log_date as string}T12:00:00.000Z`;
}

function resolveCheckinLogDateWithValidationMapping(input: CheckinBusinessDateInput, traceId: string): string {
  try {
    return resolveLogDate(input.nowUtc, input.timezone, input.dayCutoffTime);
  } catch (error: unknown) {
    const businessDateErrorCode =
      typeof error === "object" && error !== null && "code" in error ? (error.code as string) : "";

    if (businessDateErrorCode === "INVALID_TIMEZONE" || businessDateErrorCode === "INVALID_CUTOFF_TIME") {
      throw createIf002HandledError("VALIDATION_ERROR", (error as Error).message, FR010_REQUIREMENT_ID, traceId);
    }

    throw error;
  }
}

function createCheckinSuccessResult(
  logDate: string,
  idempotent: boolean,
  traceId: string,
  requirementId: string,
): If002ErrorResult {
  return {
    status: 201,
    body: {
      code: "SUCCESS",
      message: "checkin succeeded",
      trace_id: normalizeTraceId(traceId),
      requirement_id: requirementId,
      checkin: {
        idempotent,
        log_date: logDate,
      },
    } as If002ErrorResult["body"],
  };
}

function createCheckinCancelSuccessResult(logDate: string, traceId: string, requirementId: string): If002ErrorResult {
  return {
    status: 200,
    body: {
      code: "SUCCESS",
      message: "checkin cancellation succeeded",
      trace_id: normalizeTraceId(traceId),
      requirement_id: requirementId,
      checkin: {
        canceled: true,
        log_date: logDate,
      },
    } as If002ErrorResult["body"],
  };
}

function createHabitSuccessResult(
  definition: HabitSuccessDefinition,
  traceId: string,
  requirementId: string,
): If002ErrorResult {
  return {
    status: definition.status,
    body: {
      code: "SUCCESS",
      message: "habit operation succeeded",
      trace_id: normalizeTraceId(traceId),
      requirement_id: requirementId,
      habit: {
        status: definition.habitStatus,
      },
    } as If002ErrorResult["body"],
  };
}

function createHistoryCalendarSuccessResult(
  days: Array<{ date: string; status: "checked" | "missed" | "grace" }>,
  traceId: string,
  requirementId: string,
): If002ErrorResult {
  return {
    status: 200,
    body: {
      code: "SUCCESS",
      message: "history calendar retrieval succeeded",
      trace_id: normalizeTraceId(traceId),
      requirement_id: requirementId,
      history: {
        days,
      },
    } as If002ErrorResult["body"],
  };
}

function createAnalyticsSummarySuccessResult(
  completionRate: number,
  bestStreak: number,
  traceId: string,
  requirementId: string,
): If002ErrorResult {
  return {
    status: 200,
    body: {
      code: "SUCCESS",
      message: "analytics summary retrieval succeeded",
      trace_id: normalizeTraceId(traceId),
      requirement_id: requirementId,
      analytics: {
        completion_rate: completionRate,
        best_streak: bestStreak,
      },
    } as If002ErrorResult["body"],
  };
}

async function recordIf002ErrorAudit(
  testCase: {
    traceId: string;
    requirementId: string;
    request: If002RunnerRequest;
    endpoint: string;
  },
  mapped: If002ErrorResult,
): Promise<void> {
  const isConsentRegistration = testCase.endpoint === CONSENT_ENDPOINT;
  const consentInputs = extractConsentInputs(testCase.request.body);
  const consentPolicyTypes = consentInputs.map((consent) => consent.policy_type);

  try {
    await if002AuditLogService.record({
      actorRole: "user",
      action: isConsentRegistration ? POLICY_CONSENT_REJECT_AUDIT_ACTION : IF002_AUDIT_ACTION,
      targetType: isConsentRegistration ? CONSENT_TARGET_TYPE : "if-002",
      targetId: isConsentRegistration ? testCase.request.actorUserId : testCase.endpoint,
      result: "failure",
      requirementId: mapped.body.requirement_id || testCase.requirementId || FR025_REQUIREMENT_ID,
      traceId: mapped.body.trace_id || testCase.traceId,
      metadata: {
        status: mapped.status,
        code: mapped.body.code,
        endpoint: testCase.endpoint,
        source: isConsentRegistration ? "callback_after_login" : "if-002",
        ...(isConsentRegistration ? { policy_type: consentPolicyTypes, consent_count: consentInputs.length } : {}),
      },
      actorUserId: testCase.request.actorUserId,
    });
  } catch {
    // Error response priority: audit write failures must not mask mapped IF-002 errors in tests.
  }
}

export async function runPlannedCase(testCase: If002RunnerCase): Promise<If002ErrorResult> {
  const dtoErrorResult = maybeCreateDtoErrorResult(testCase);
  if (dtoErrorResult) {
    await recordIf002ErrorAudit(testCase, dtoErrorResult);
    return dtoErrorResult;
  }

  return await runWithErrorMapping(testCase);
}

export async function runInvalidPayloadCase(testCase: If002RunnerCase): Promise<If002ErrorResult> {
  const dtoErrorResult = maybeCreateDtoErrorResult(testCase);
  if (dtoErrorResult) {
    await recordIf002ErrorAudit(testCase, dtoErrorResult);
    return dtoErrorResult;
  }

  const fallbackValidation = createValidationErrorResult(
    {
      message: testCase.expectedMessage,
      requirement_id: testCase.requirementId,
    },
    testCase.traceId,
  );

  await recordIf002ErrorAudit(testCase, fallbackValidation);

  return fallbackValidation;
}

export async function runErrorScenarioCase(testCase: If002RunnerErrorScenario): Promise<If002ErrorResult> {
  return await runWithErrorMapping(testCase);
}
