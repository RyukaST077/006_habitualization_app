import { createAppError } from "../common/AppError";
import type { OpsRepositoryContract } from "../../domain/repositories/contracts";
import type { AuditLogRecord } from "../../domain/repositories/types";

const POLICY_SETTINGS_REQUIRED_METADATA_FIELDS = ["old_version", "new_version", "policy_type"] as const;
const AUDIT_LOG_WRITE_FAILED_MESSAGE = "failed to write audit log";

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

export class AuditLogService {
  public constructor(private readonly opsRepository: OpsRepositoryContract) {}

  public async record(input: AuditRecordInput): Promise<AuditLogRecord> {
    assertNonEmpty(input.actorRole, "actorRole");
    assertNonEmpty(input.action, "action");
    assertNonEmpty(input.targetType, "targetType");
    assertNonEmpty(input.targetId, "targetId");
    assertNonEmpty(input.result, "result");
    assertNonEmpty(input.requirementId, "requirementId");
    assertNonEmpty(input.traceId, "traceId");

    if (isPolicySettingsUpdate(input)) {
      assertPolicySettingsMetadata(input);
    }

    try {
      return await this.opsRepository.insertAuditLog({
        actorRole: input.actorRole,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        result: input.result,
        requirementId: input.requirementId,
        traceId: input.traceId,
        metadata: input.metadata,
        actorUserId: input.actorUserId,
      });
    } catch {
      throw createAppError({
        code: "AUDIT_LOG_WRITE_FAILED",
        message: AUDIT_LOG_WRITE_FAILED_MESSAGE,
        requirementId: input.requirementId,
        traceId: input.traceId,
      });
    }
  }
}
