import { randomUUID } from "node:crypto";

import { createAppError, isAppError } from "../common/AppError";
import { normalizeTraceId } from "../common/trace-id";
import type { OpsRepositoryContract, UserRepositoryContract } from "../../domain/repositories/contracts";
import { RepositoryDomainError } from "../../domain/repositories/errors";
import { HardDeleteJobRunner } from "./HardDeleteJobRunner";
import type { HardDeleteBatchResult, RequestWithdrawalResult, WithdrawalAuditLogPort } from "./types";
import {
  WITHDRAWAL_ALREADY_REQUESTED_CODE,
  WITHDRAWAL_REQUEST_REQUIREMENT_ID,
  WITHDRAWAL_RESULT_REQUIREMENT_ID,
} from "./types";

const WITHDRAW_REQUEST = "WITHDRAW_REQUEST";
const WITHDRAW_RESULT = "WITHDRAW_RESULT";

function createTraceId(): string {
  return normalizeTraceId(`withdrawal-request-${randomUUID()}`);
}

function addSeconds(baseIso: string, seconds: number): string {
  const ms = Date.parse(baseIso);
  if (Number.isNaN(ms)) {
    return baseIso;
  }
  return new Date(ms + seconds * 1000).toISOString();
}

export class WithdrawalService {
  private readonly hardDeleteJobRunner: HardDeleteJobRunner;

  public constructor(
    private readonly userRepository: UserRepositoryContract,
    private readonly opsRepository: OpsRepositoryContract,
    private readonly now: () => string = () => new Date().toISOString(),
    private readonly auditLogService?: WithdrawalAuditLogPort,
  ) {
    this.hardDeleteJobRunner = new HardDeleteJobRunner(userRepository, opsRepository, now);
  }

  public async requestWithdrawal(
    userId: string,
    requestedAt: string = this.now(),
    traceId: string = createTraceId(),
  ): Promise<RequestWithdrawalResult> {
    const normalizedTraceId = normalizeTraceId(traceId);
    const disableDueAt = addSeconds(requestedAt, 60);
    const hardDeleteDueAt = addSeconds(requestedAt, 300);

    try {
      await this.userRepository.markAccountDisabled(userId, requestedAt);
      const job = await this.opsRepository.createDeletionJob({
        userId,
        requestedAt,
        disableDueAt,
        hardDeleteDueAt,
        disabledAt: requestedAt,
      });

      await this.recordWithdrawalAudit({
        actorUserId: userId,
        action: WITHDRAW_REQUEST,
        requirementId: WITHDRAWAL_REQUEST_REQUIREMENT_ID,
        traceId: normalizedTraceId,
        result: "success",
        metadata: {
          requested_at: requestedAt,
          disable_due_at: disableDueAt,
          hard_delete_due_at: hardDeleteDueAt,
          job_id: job.jobId,
        },
      });
      await this.recordWithdrawalAudit({
        actorUserId: userId,
        action: WITHDRAW_RESULT,
        requirementId: WITHDRAWAL_RESULT_REQUIREMENT_ID,
        traceId: normalizedTraceId,
        result: "success",
        metadata: {
          job_id: job.jobId,
          job_status: job.status,
        },
      });

      return {
        userId,
        accountStatus: "disabled",
        requestedAt,
        disableDueAt,
        hardDeleteDueAt,
        jobId: job.jobId,
        jobStatus: "queued",
      };
    } catch (error: unknown) {
      const mappedError = this.mapRequestError(error, normalizedTraceId);
      await this.recordWithdrawalAudit({
        actorUserId: userId,
        action: WITHDRAW_RESULT,
        requirementId: WITHDRAWAL_RESULT_REQUIREMENT_ID,
        traceId: normalizedTraceId,
        result: "failure",
        metadata: {
          reason: mappedError.message,
          error_code: mappedError.code,
        },
      }).catch(() => {
        // Preserve original withdrawal failure in caller-visible response.
      });
      throw mappedError;
    }
  }

  public async runHardDeleteJob(now: string = this.now()): Promise<HardDeleteBatchResult> {
    return this.hardDeleteJobRunner.run(now);
  }

  private async recordWithdrawalAudit(input: {
    actorUserId: string;
    action: string;
    requirementId: string;
    traceId: string;
    result: "success" | "failure";
    metadata: Record<string, unknown>;
  }): Promise<void> {
    if (!this.auditLogService) {
      return;
    }

    await this.auditLogService.record({
      actorRole: "user",
      action: input.action,
      targetType: "profiles",
      targetId: input.actorUserId,
      result: input.result,
      requirementId: input.requirementId,
      traceId: input.traceId,
      actorUserId: input.actorUserId,
      metadata: input.metadata,
    });
  }

  private mapRequestError(error: unknown, traceId: string) {
    if (isAppError(error)) {
      return error;
    }
    if (error instanceof RepositoryDomainError && error.code === "UNIQUE_CONFLICT") {
      return createAppError({
        code: WITHDRAWAL_ALREADY_REQUESTED_CODE,
        message: "withdrawal already requested",
        requirementId: WITHDRAWAL_REQUEST_REQUIREMENT_ID,
        traceId,
      });
    }
    if (error instanceof RepositoryDomainError && error.code === "FORBIDDEN") {
      return createAppError({
        code: "FORBIDDEN",
        message: "withdrawal access denied",
        requirementId: WITHDRAWAL_REQUEST_REQUIREMENT_ID,
        traceId,
      });
    }

    return createAppError({
      code: "INTERNAL_ERROR",
      message: "withdrawal request failed",
      requirementId: WITHDRAWAL_REQUEST_REQUIREMENT_ID,
      traceId,
    });
  }
}
