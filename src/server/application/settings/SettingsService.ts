import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { UserRepositoryContract } from "../../domain/repositories/contracts";
import { RepositoryDomainError } from "../../domain/repositories/errors";
import type {
  ProfileSettings,
  UpdateProfileSettingsInput,
  UpdateProfileSettingsResult,
} from "./types";

const SETTINGS_READ_REQUIREMENT_ID = "FR-019";
const SETTINGS_UPDATE_REQUIREMENT_ID = "FR-020";
const SETTINGS_VALIDATION_REQUIREMENT_ID = "FR-021";
const SETTINGS_AUDIT_REQUIREMENT_ID = "FR-022";
const SETTINGS_UPDATE_AUDIT_ACTION = "SETTINGS_UPDATE";
const SETTINGS_UPDATE_AUDIT_TARGET_TYPE = "profiles";

const HH_MM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function isValidIanaTimeZone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

function normalizeCutoffForStorage(dayCutoffTime: string): string {
  return `${dayCutoffTime}:00`;
}

function normalizeCutoffForResponse(dayCutoffTime: string): string {
  const hhmm = dayCutoffTime.slice(0, 5);
  return HH_MM_PATTERN.test(hhmm) ? hhmm : dayCutoffTime;
}

function createTraceId(label: string): string {
  return normalizeTraceId(`settings-${label}-${randomUUID()}`);
}

interface SettingsAuditLogPort {
  record(input: {
    actorRole: string;
    action: string;
    targetType: string;
    targetId: string;
    result: string;
    requirementId: string;
    traceId: string;
    metadata?: Record<string, unknown>;
    actorUserId?: string | null;
  }): Promise<unknown>;
}

export class SettingsService {
  public constructor(
    private readonly userRepository: UserRepositoryContract,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly auditLogService?: SettingsAuditLogPort,
  ) {}

  public async getProfileSettings(
    userId: string,
    traceId: string = createTraceId("get-profile-settings"),
  ): Promise<ProfileSettings> {
    try {
      const snapshot = this.userRepository.getProfileSettings
        ? await this.userRepository.getProfileSettings(userId)
        : await this.userRepository.findProfile(userId);

      if (snapshot === null) {
        throw createAppError({
          code: "FORBIDDEN",
          message: "profile not found",
          requirementId: SETTINGS_READ_REQUIREMENT_ID,
          traceId,
        });
      }

      return {
        timezone: snapshot.timezone,
        dayCutoffTime: normalizeCutoffForResponse(snapshot.dayCutoffTime),
        version: snapshot.version,
      };
    } catch (error: unknown) {
      throw this.mapReadError(error, traceId);
    }
  }

  public async updateProfileSettings(
    userId: string,
    input: UpdateProfileSettingsInput,
    traceId: string = createTraceId("update-profile-settings"),
  ): Promise<UpdateProfileSettingsResult> {
    const normalizedTraceId = normalizeTraceId(traceId);
    const effectiveFrom = this.now();

    try {
      this.assertValidInput(input, normalizedTraceId);
      const normalizedCutoff = normalizeCutoffForStorage(input.dayCutoffTime);

      // FR-020: settings update only mutates profile settings for future business-date resolution.
      const updatedProfile = this.userRepository.updateProfileSettingsSnapshot
        ? await this.userRepository.updateProfileSettingsSnapshot(
            userId,
            input.timezone,
            normalizedCutoff,
            input.version,
          )
        : await this.userRepository.updateProfileSettings(
            userId,
            input.timezone,
            normalizedCutoff,
            input.version,
          );

      await this.recordSettingsUpdateAudit({
        actorUserId: userId,
        targetId: userId,
        traceId: normalizedTraceId,
        result: "success",
        metadata: {
          timezone: updatedProfile.timezone,
          day_cutoff_time: normalizeCutoffForResponse(updatedProfile.dayCutoffTime),
          version: updatedProfile.version,
          effective_from: effectiveFrom,
        },
      });

      return {
        saved: true,
        timezone: updatedProfile.timezone,
        dayCutoffTime: normalizeCutoffForResponse(updatedProfile.dayCutoffTime),
        version: updatedProfile.version,
        effectiveFrom,
      };
    } catch (error: unknown) {
      const mappedError = this.mapUpdateError(error, normalizedTraceId);
      await this.recordSettingsUpdateAudit({
        actorUserId: userId,
        targetId: userId,
        traceId: normalizedTraceId,
        result: "failure",
        metadata: {
          reason: mappedError.message,
          error_code: mappedError.code,
        },
      }).catch(() => {
        // Preserve original update failure in caller-visible response.
      });
      throw mappedError;
    }
  }

  private async recordSettingsUpdateAudit(input: {
    actorUserId: string;
    targetId: string;
    traceId: string;
    result: "success" | "failure";
    metadata: Record<string, unknown>;
  }): Promise<void> {
    if (!this.auditLogService) {
      return;
    }

    await this.auditLogService.record({
      actorRole: "user",
      action: SETTINGS_UPDATE_AUDIT_ACTION,
      targetType: SETTINGS_UPDATE_AUDIT_TARGET_TYPE,
      targetId: input.targetId,
      result: input.result,
      requirementId: SETTINGS_AUDIT_REQUIREMENT_ID,
      traceId: input.traceId,
      actorUserId: input.actorUserId,
      metadata: input.metadata,
    });
  }

  private assertValidInput(input: UpdateProfileSettingsInput, traceId: string): void {
    if (!isValidIanaTimeZone(input.timezone)) {
      throw createAppError({
        code: "VALIDATION_ERROR",
        message: "timezone is invalid",
        requirementId: SETTINGS_VALIDATION_REQUIREMENT_ID,
        traceId,
      });
    }

    if (!HH_MM_PATTERN.test(input.dayCutoffTime)) {
      throw createAppError({
        code: "VALIDATION_ERROR",
        message: "day_cutoff_time must be hh:mm",
        requirementId: SETTINGS_VALIDATION_REQUIREMENT_ID,
        traceId,
      });
    }

    if (!Number.isInteger(input.version) || input.version < 1) {
      throw createAppError({
        code: "VALIDATION_ERROR",
        message: "version must be integer >= 1",
        requirementId: SETTINGS_VALIDATION_REQUIREMENT_ID,
        traceId,
      });
    }
  }

  private mapReadError(error: unknown, traceId: string) {
    if (isAppError(error)) {
      return error;
    }
    if (error instanceof RepositoryDomainError && error.code === "FORBIDDEN") {
      return createAppError({
        code: "FORBIDDEN",
        message: "settings read denied",
        requirementId: SETTINGS_READ_REQUIREMENT_ID,
        traceId,
      });
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: "failed to load profile settings",
      requirementId: SETTINGS_READ_REQUIREMENT_ID,
      traceId,
    });
  }

  private mapUpdateError(error: unknown, traceId: string) {
    if (isAppError(error)) {
      return error;
    }
    if (error instanceof RepositoryDomainError && error.code === "FORBIDDEN") {
      return createAppError({
        code: "FORBIDDEN",
        message: "settings update denied",
        requirementId: SETTINGS_UPDATE_REQUIREMENT_ID,
        traceId,
      });
    }
    if (error instanceof RepositoryDomainError && error.code === "OPTIMISTIC_LOCK_CONFLICT") {
      return createAppError({
        code: "DOMAIN_CONFLICT",
        message: "settings update conflicted",
        requirementId: SETTINGS_UPDATE_REQUIREMENT_ID,
        traceId,
      });
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: "settings update failed",
      requirementId: SETTINGS_UPDATE_REQUIREMENT_ID,
      traceId,
    });
  }
}
