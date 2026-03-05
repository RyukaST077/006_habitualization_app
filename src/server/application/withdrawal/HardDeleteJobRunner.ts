import type { OpsRepositoryContract, UserRepositoryContract } from "../../domain/repositories/contracts";
import type { HardDeleteBatchResult } from "./types";

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) {
    return error.message;
  }
  return "hard delete failed";
}

export class HardDeleteJobRunner {
  public constructor(
    private readonly userRepository: UserRepositoryContract,
    private readonly opsRepository: OpsRepositoryContract,
    private readonly now: () => string = () => new Date().toISOString(),
  ) {}

  public async run(now: string = this.now()): Promise<HardDeleteBatchResult> {
    const pending = await this.opsRepository.listPendingDeletionJobs(now);
    let completedJobs = 0;
    let failedJobs = 0;

    for (const job of pending) {
      let runningJob = job;
      if (job.status === "queued") {
        runningJob = await this.opsRepository.updateDeletionJobStatus(job.jobId, "in_progress");
      }

      if (runningJob.status !== "in_progress" || runningJob.hardDeleteDueAt > now) {
        continue;
      }

      try {
        await this.userRepository.hardDeleteAccountData(runningJob.userId, now);
        await this.opsRepository.updateDeletionJobStatus(runningJob.jobId, "completed");
        completedJobs += 1;
      } catch (error: unknown) {
        await this.opsRepository.updateDeletionJobStatus(runningJob.jobId, {
          status: "failed",
          lastError: toErrorMessage(error),
        });
        failedJobs += 1;
      }
    }

    return {
      processedJobs: pending.length,
      completedJobs,
      failedJobs,
    };
  }

  public async rerunFailedJob(jobId: string): Promise<void> {
    await this.opsRepository.updateDeletionJobStatus(jobId, "in_progress");
  }
}
