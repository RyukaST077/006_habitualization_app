import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import { AuthorizationPolicyError, AuthorizationPolicyService } from "../authz/AuthorizationPolicyService";
import type {
  HabitAuthorizationPolicyPort,
  HabitRepositoryContract,
  UserRepositoryContract,
} from "../../domain/repositories/contracts";
import { RepositoryDomainError } from "../../domain/repositories/errors";
import { resolveLogDate } from "../../domain/time/BusinessDateService";
import type { CheckinCancelResult, CheckinResult } from "./types";

const REGISTER_CHECKIN_REQUIREMENT_ID = "FR-011";
const CANCEL_CHECKIN_REQUIREMENT_ID = "FR-014";

function createTraceId(): string {
  return normalizeTraceId(`checkin-register-${randomUUID()}`);
}

function createCancelTraceId(): string {
  return normalizeTraceId(`checkin-cancel-${randomUUID()}`);
}

function normalizeCutoffTime(dayCutoffTime: string): string {
  const hhmm = dayCutoffTime.slice(0, 5);
  if (/^\d{2}:\d{2}$/.test(hhmm)) {
    return hhmm;
  }
  return dayCutoffTime;
}

function isForbiddenLikeError(error: unknown): boolean {
  if (error instanceof AuthorizationPolicyError) {
    return true;
  }
  if (error instanceof RepositoryDomainError && error.code === "FORBIDDEN") {
    return true;
  }
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const candidate = error as { code?: unknown; status?: unknown };
  return candidate.code === "FORBIDDEN" || candidate.status === 403;
}

export class CheckinService {
  public constructor(
    private readonly userRepository: UserRepositoryContract,
    private readonly habitRepository: HabitRepositoryContract,
    private readonly authorizationPolicy: HabitAuthorizationPolicyPort = new AuthorizationPolicyService(),
  ) {}

  public async registerCheckin(
    userId: string,
    habitId: string,
    nowUtc: string,
    traceId: string = createTraceId(),
  ): Promise<CheckinResult> {
    try {
      this.authorizationPolicy.assertSelf(userId, userId);
      const profile = await this.userRepository.findProfile(userId);
      if (profile === null) {
        throw createAppError({
          code: "FORBIDDEN",
          message: "profile not found",
          requirementId: REGISTER_CHECKIN_REQUIREMENT_ID,
          traceId,
        });
      }

      const logDate = resolveLogDate(nowUtc, profile.timezone, normalizeCutoffTime(profile.dayCutoffTime));
      const upsertResult = await this.habitRepository.upsertCheckin(userId, habitId, logDate, nowUtc);

      return {
        logDate: upsertResult.log.logDate,
        idempotent: upsertResult.idempotent,
      };
    } catch (error: unknown) {
      throw this.mapRegisterError(error, traceId);
    }
  }

  public async cancelTodayCheckin(
    userId: string,
    habitId: string,
    nowUtc: string,
    traceId: string = createCancelTraceId(),
  ): Promise<CheckinCancelResult> {
    try {
      this.authorizationPolicy.assertSelf(userId, userId);
      const profile = await this.userRepository.findProfile(userId);
      if (profile === null) {
        throw createAppError({
          code: "FORBIDDEN",
          message: "profile not found",
          requirementId: CANCEL_CHECKIN_REQUIREMENT_ID,
          traceId,
        });
      }

      const logDate = resolveLogDate(nowUtc, profile.timezone, normalizeCutoffTime(profile.dayCutoffTime));
      const deleted = await this.habitRepository.deleteCheckin(userId, habitId, logDate);
      if (!deleted) {
        throw createAppError({
          code: "CHECKIN_CANCEL_NOT_ALLOWED",
          message: "checkin cancellation is allowed only for today",
          requirementId: CANCEL_CHECKIN_REQUIREMENT_ID,
          traceId,
        });
      }

      return {
        logDate,
        canceled: true,
      };
    } catch (error: unknown) {
      throw this.mapCancelError(error, traceId);
    }
  }

  private mapRegisterError(error: unknown, traceId: string) {
    if (isAppError(error)) {
      return error;
    }
    if (isForbiddenLikeError(error)) {
      return createAppError({
        code: "FORBIDDEN",
        message: "checkin access denied",
        requirementId: REGISTER_CHECKIN_REQUIREMENT_ID,
        traceId,
      });
    }
    if (error instanceof RepositoryDomainError && error.code === "CHECKIN_CONFLICT") {
      return createAppError({
        code: "DOMAIN_CONFLICT",
        message: "checkin registration conflicted",
        requirementId: REGISTER_CHECKIN_REQUIREMENT_ID,
        traceId,
      });
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: "checkin registration failed",
      requirementId: REGISTER_CHECKIN_REQUIREMENT_ID,
      traceId,
    });
  }

  private mapCancelError(error: unknown, traceId: string) {
    if (isAppError(error)) {
      return error;
    }
    if (isForbiddenLikeError(error)) {
      return createAppError({
        code: "FORBIDDEN",
        message: "checkin cancellation access denied",
        requirementId: CANCEL_CHECKIN_REQUIREMENT_ID,
        traceId,
      });
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: "checkin cancellation failed",
      requirementId: CANCEL_CHECKIN_REQUIREMENT_ID,
      traceId,
    });
  }
}
