import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import { AuthorizationPolicyError, AuthorizationPolicyService } from "../authz/AuthorizationPolicyService";
import type {
  HabitAuditLogPort,
  HabitAuthorizationPolicyPort,
  HabitRepositoryContract,
} from "../../domain/repositories/contracts";
import { RepositoryDomainError } from "../../domain/repositories/errors";
import type { Habit, HabitUpdatePayload } from "../../domain/repositories/types";

const NAME_MIN = 1;
const NAME_MAX = 80;
const DISPLAY_ORDER_MIN = 1;
const DISPLAY_ORDER_MAX = 9999;

const HABIT_TARGET_TYPE = "habit";
const ACTOR_ROLE = "user";
const REQUIREMENT_BY_ACTION = {
  HABIT_CREATE: "FR-006",
  HABIT_UPDATE: "FR-007",
  HABIT_ARCHIVE: "FR-008",
  HABIT_RESUME: "FR-009",
} as const;

type HabitAction = keyof typeof REQUIREMENT_BY_ACTION;

function isValidName(name: string): boolean {
  return name.length >= NAME_MIN && name.length <= NAME_MAX;
}

function isValidDisplayOrder(displayOrder: number): boolean {
  return Number.isInteger(displayOrder) && displayOrder >= DISPLAY_ORDER_MIN && displayOrder <= DISPLAY_ORDER_MAX;
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

function createTraceId(label: string): string {
  return normalizeTraceId(`habit-${label}-${randomUUID()}`);
}

export class HabitService {
  public constructor(
    private readonly habitRepository: HabitRepositoryContract,
    private readonly auditLogPort: HabitAuditLogPort,
    private readonly authorizationPolicy: HabitAuthorizationPolicyPort = new AuthorizationPolicyService(),
  ) {}

  public async createHabit(
    userId: string,
    name: string,
    displayOrder: number,
    traceId: string = createTraceId("create"),
  ): Promise<Habit> {
    if (!isValidName(name) || !isValidDisplayOrder(displayOrder)) {
      throw this.createInvalidInputError("FR-006", traceId);
    }

    try {
      this.authorizationPolicy.assertSelf(userId, userId);
      const habit = await this.habitRepository.createHabit(userId, name, displayOrder);
      await this.recordHabitAudit("HABIT_CREATE", userId, habit.habitId, traceId);
      return habit;
    } catch (error: unknown) {
      throw this.mapError(error, "FR-006", traceId);
    }
  }

  public async updateHabit(
    userId: string,
    habitId: string,
    payload: HabitUpdatePayload,
    traceId: string = createTraceId("update"),
  ): Promise<Habit> {
    if (!Number.isInteger(payload.version) || payload.version < 1) {
      throw this.createInvalidInputError("FR-007", traceId);
    }
    if (payload.name !== undefined && !isValidName(payload.name)) {
      throw this.createInvalidInputError("FR-007", traceId);
    }
    if (payload.displayOrder !== undefined && !isValidDisplayOrder(payload.displayOrder)) {
      throw this.createInvalidInputError("FR-007", traceId);
    }

    try {
      this.authorizationPolicy.assertSelf(userId, userId);
      const habit = await this.habitRepository.updateHabit(userId, habitId, payload);
      await this.recordHabitAudit("HABIT_UPDATE", userId, habit.habitId, traceId);
      return habit;
    } catch (error: unknown) {
      throw this.mapError(error, "FR-007", traceId);
    }
  }

  public async archiveHabit(userId: string, habitId: string, traceId: string = createTraceId("archive")): Promise<Habit> {
    try {
      this.authorizationPolicy.assertSelf(userId, userId);
      const habit = await this.habitRepository.setHabitStatus(userId, habitId, "archived");
      await this.recordHabitAudit("HABIT_ARCHIVE", userId, habit.habitId, traceId);
      return habit;
    } catch (error: unknown) {
      throw this.mapError(error, "FR-008", traceId);
    }
  }

  public async resumeHabit(userId: string, habitId: string, traceId: string = createTraceId("resume")): Promise<Habit> {
    try {
      this.authorizationPolicy.assertSelf(userId, userId);
      const habit = await this.habitRepository.setHabitStatus(userId, habitId, "active");
      await this.recordHabitAudit("HABIT_RESUME", userId, habit.habitId, traceId);
      return habit;
    } catch (error: unknown) {
      throw this.mapError(error, "FR-009", traceId);
    }
  }

  private async recordHabitAudit(action: HabitAction, userId: string, habitId: string, traceId: string): Promise<void> {
    await this.auditLogPort.record({
      actorRole: ACTOR_ROLE,
      action,
      targetType: HABIT_TARGET_TYPE,
      targetId: habitId,
      result: "SUCCESS",
      requirementId: REQUIREMENT_BY_ACTION[action],
      traceId,
      actorUserId: userId,
      metadata: {
        status: "SUCCESS",
      },
    });
  }

  private createInvalidInputError(requirementId: string, traceId: string) {
    return createAppError({
      code: "INVALID_HABIT_INPUT",
      message: "habit input is invalid",
      requirementId,
      traceId,
    });
  }

  private mapError(error: unknown, requirementId: string, traceId: string) {
    if (isAppError(error)) {
      return error;
    }
    if (isForbiddenLikeError(error)) {
      return createAppError({
        code: "FORBIDDEN",
        message: "habit access denied",
        requirementId,
        traceId,
      });
    }
    if (error instanceof RepositoryDomainError && error.code === "INVALID_HABIT_INPUT") {
      return this.createInvalidInputError(requirementId, traceId);
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: "habit operation failed",
      requirementId,
      traceId,
    });
  }
}
