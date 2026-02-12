import { describe, it } from 'vitest';

import {
  expectRepositoryMethods,
  expectSourceKeywords,
  loadRepositorySource,
} from '../../helpers/db/repository-contract-assertions';

describe('M-104 OpsRepository contract (Red)', () => {
  it('defines ops methods for queued/in_progress/completed/failed and pending/sent flows', () => {
    const sourceCode = loadRepositorySource('src/server/infrastructure/repositories/OpsRepository.ts');

    expectRepositoryMethods(sourceCode, 'OpsRepository', [
      'insertAuditLog',
      'upsertDailyKpi',
      'createDeletionJob',
      'updateDeletionJobStatus',
      'listPendingDeletionJobs',
      'insertMonitoringAlertEvent',
      'markAlertDispatched',
      'queryKpiForReport',
      'queryAuditLogsForReport',
    ]);
    expectSourceKeywords(sourceCode, [
      'queued',
      'in_progress',
      'completed',
      'failed',
      'pending',
      'sent',
      'transaction',
    ]);
  });
});

