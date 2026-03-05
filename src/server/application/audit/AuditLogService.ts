import { createAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { OpsRepositoryContract } from "../../domain/repositories/contracts";
import type { AuditLogRecord } from "../../domain/repositories/types";

const POLICY_SETTINGS_REQUIRED_METADATA_FIELDS = ["old_version", "new_version", "policy_type"] as const;
const AUDIT_LOG_WRITE_FAILED_MESSAGE = "failed to write audit log";
const AUTH_LOGIN_ACTIONS = new Set(["LOGIN_START", "LOGIN_SUCCESS", "LOGIN_FAILED"] as const);
const SETTINGS_UPDATE_ACTION = "SETTINGS_UPDATE";

export interface AuditRecordInput {
  actorRole: string;
  action: string;
  targetType: string;
  targetId: string;
  result: string;
  requirementId: string;
  traceId: string;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
}

function assertNonEmpty(value: string, name: string): void {
  if (value.trim().length === 0) {
    throw new Error(`${name} is required`);
  }
}

function isAuthLoginAction(action: string): action is "LOGIN_START" | "LOGIN_SUCCESS" | "LOGIN_FAILED" {
  return AUTH_LOGIN_ACTIONS.has(action as "LOGIN_START" | "LOGIN_SUCCESS" | "LOGIN_FAILED");
}

function normalizeInput(input: AuditRecordInput): AuditRecordInput {
  return {
    ...input,
    actorRole: input.actorRole.trim(),
    action: input.action.trim(),
    targetType: input.targetType.trim(),
    targetId: input.targetId.trim(),
    result: input.result.trim(),
    requirementId: input.requirementId.trim(),
    traceId: normalizeTraceId(input.traceId),
  };
}

function assertRequiredFields(input: AuditRecordInput): void {
  assertNonEmpty(input.actorRole, "actorRole");
  assertNonEmpty(input.action, "action");
  assertNonEmpty(input.targetType, "targetType");
  assertNonEmpty(input.targetId, "targetId");
  assertNonEmpty(input.result, "result");
  assertNonEmpty(input.requirementId, "requirementId");
  assertNonEmpty(input.traceId, "traceId");
}

function assertAuthLoginEvent(input: AuditRecordInput): void {
  if (!isAuthLoginAction(input.action)) {
    return;
  }

  if (input.targetType !== "auth_session") {
    throw new Error("targetType must be auth_session for LOGIN_* action");
  }
}

function isPolicySettingsUpdate(input: AuditRecordInput): boolean {
  return input.targetType === "policy_settings" && input.action.toLowerCase().includes("update");
}

function assertPolicySettingsMetadata(input: AuditRecordInput): void {
  const metadata = input.metadata ?? {};
  for (const field of POLICY_SETTINGS_REQUIRED_METADATA_FIELDS) {
    const value = metadata[field];
    if (value === undefined || value === null || (typeof value === "string" && value.trim().length === 0)) {
      throw new Error(`metadata.${field} is required`);
    }
  }
}

function normalizeSettingsUpdateResult(result: string): "success" | "failure" {
  const normalized = result.trim().toLowerCase();
  if (normalized === "success") {
    return "success";
  }
  if (normalized === "failure" || normalized === "failed") {
    return "failure";
  }
  throw new Error("result must be success|failure for SETTINGS_UPDATE");
}

function normalizeSettingsUpdateInput(input: AuditRecordInput): AuditRecordInput {
  return {
    ...input,
    action: SETTINGS_UPDATE_ACTION,
    result: normalizeSettingsUpdateResult(input.result),
  };
}

function assertSettingsUpdateRequiredFields(input: AuditRecordInput): void {
  if (input.actorUserId === undefined || input.actorUserId === null || input.actorUserId.trim().length === 0) {
    throw new Error("actorUserId is required for SETTINGS_UPDATE");
  }

  if (input.targetId.trim().length === 0) {
    throw new Error("targetId is required for SETTINGS_UPDATE");
  }

  if (input.requirementId.trim().length === 0) {
    throw new Error("requirementId is required for SETTINGS_UPDATE");
  }

  if (input.traceId.trim().length === 0) {
    throw new Error("traceId is required for SETTINGS_UPDATE");
  }

  if (input.result === "failure") {
    const reason = input.metadata?.reason;
    if (typeof reason !== "string" || reason.trim().length === 0) {
      throw new Error("metadata.reason is required for SETTINGS_UPDATE failure");
    }
  }
}

export class AuditLogService {
  public constructor(private readonly opsRepository: OpsRepositoryContract) {}

  public async record(input: AuditRecordInput): Promise<AuditLogRecord> {
    let normalized = normalizeInput(input);
    assertRequiredFields(normalized);
    assertAuthLoginEvent(normalized);

    if (normalized.action === SETTINGS_UPDATE_ACTION) {
      normalized = normalizeSettingsUpdateInput(normalized);
      assertSettingsUpdateRequiredFields(normalized);
    }

    if (isPolicySettingsUpdate(normalized)) {
      assertPolicySettingsMetadata(normalized);
    }

    try {
      return await this.opsRepository.insertAuditLog({
        actorRole: normalized.actorRole,
        action: normalized.action,
        targetType: normalized.targetType,
        targetId: normalized.targetId,
        result: normalized.result,
        requirementId: normalized.requirementId,
        traceId: normalized.traceId,
        metadata: normalized.metadata,
        actorUserId: normalized.actorUserId,
      });
    } catch {
      throw createAppError({
        code: "AUDIT_LOG_WRITE_FAILED",
        message: AUDIT_LOG_WRITE_FAILED_MESSAGE,
        requirementId: normalized.requirementId,
        traceId: normalized.traceId,
      });
    }
  }
}
