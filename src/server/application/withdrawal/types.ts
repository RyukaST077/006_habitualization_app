export const WITHDRAWAL_REQUEST_REQUIREMENT_ID = "FR-023";
export const WITHDRAWAL_RESULT_REQUIREMENT_ID = "FR-024";
export const WITHDRAWAL_REQUEST_AUDIT_ACTION = "WITHDRAW_REQUEST";
export const WITHDRAWAL_RESULT_AUDIT_ACTION = "WITHDRAW_RESULT";
export const WITHDRAWAL_ALREADY_REQUESTED_CODE = "WITHDRAWAL_ALREADY_REQUESTED";

export interface RequestWithdrawalResult {
  userId: string;
  accountStatus: "disabled";
  requestedAt: string;
  disableDueAt: string;
  hardDeleteDueAt: string;
  jobId: string;
  jobStatus: "queued";
}

export interface HardDeleteBatchResult {
  processedJobs: number;
  completedJobs: number;
  failedJobs: number;
}

export interface WithdrawalAuditLogPort {
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
