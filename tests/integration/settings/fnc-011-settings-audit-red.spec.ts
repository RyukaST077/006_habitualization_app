import { describe, expect, it } from "vitest";

import { AuditLogService } from "../../../src/server/application/audit/AuditLogService";
import { SettingsService } from "../../../src/server/application/settings/SettingsService";
import { UserRepository } from "../../../src/server/infrastructure/repositories/UserRepository";
import { OpsRepository } from "../../../src/server/infrastructure/repositories/OpsRepository";
import { createSupabaseRepositoryClient } from "../../../src/server/infrastructure/repositories/supabase-repository-client";
import {
  FNC011_AUDIT_FAILURE_CASE,
  FNC011_AUDIT_SUCCESS_CASES,
} from "./fixtures/fnc-011-audit-cases";

function createAuditScenario() {
  const client = createSupabaseRepositoryClient({
    profiles: [
      {
        userId: "user-audit-001",
        displayName: "Audit Tester",
        timezone: "Asia/Tokyo",
        dayCutoffTime: "03:00:00",
        accountStatus: "active",
        version: 1,
      },
    ],
  });

  const userRepository = new UserRepository(client);
  const opsRepository = new OpsRepository(client);
  const auditLogService = new AuditLogService(opsRepository);
  const settingsService = new SettingsService(
    userRepository,
    () => "2026-03-05T00:00:00.000Z",
    auditLogService,
  );

  return { settingsService, opsRepository };
}

describe("T-028 C-004 FNC-011 settings update audit integration tests", () => {
  it.each(FNC011_AUDIT_SUCCESS_CASES)(
    "$traceId: SETTINGS_UPDATE success 監査を必須項目つきで記録する",
    async (testCase) => {
      const { settingsService, opsRepository } = createAuditScenario();

      if (testCase.testCaseId === "TC-IT-FR-022-002") {
        await settingsService.updateProfileSettings(
          testCase.actorUserId,
          {
            timezone: "UTC",
            dayCutoffTime: "04:00",
            version: 1,
          },
          `${testCase.traceId}-prepare`,
        );
      }

      await settingsService.updateProfileSettings(
        testCase.actorUserId,
        testCase.input,
        testCase.traceId,
      );

      const rows = await opsRepository.queryAuditLogsForReport({
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-12-31T23:59:59.999Z",
        actions: ["SETTINGS_UPDATE"],
      });
      const target = rows.find((row) => row.traceId === `trace-${testCase.traceId}`);

      expect(target).toBeDefined();
      expect(target?.action).toBe("SETTINGS_UPDATE");
      expect(target?.result).toBe(testCase.expectedResult);
      expect(target?.actorUserId).toBe(testCase.actorUserId);
      expect(target?.targetId).toBe(testCase.targetId);
      expect(target?.requirementId).toBe(testCase.requirementId);
      expect(target?.traceId).toBe(`trace-${testCase.traceId}`);

      // IF-005 RPT-002 compatibility columns
      expect(typeof target?.occurredAt).toBe("string");
      expect(typeof target?.action).toBe("string");
      expect(typeof target?.targetId).toBe("string");
      expect(typeof target?.result).toBe("string");
      expect(typeof target?.requirementId).toBe("string");
    },
  );

  it(`${FNC011_AUDIT_FAILURE_CASE.traceId}: 更新失敗時は result=failure と reason を記録する`, async () => {
    const { settingsService, opsRepository } = createAuditScenario();

    await settingsService.updateProfileSettings(
      FNC011_AUDIT_FAILURE_CASE.actorUserId,
      {
        timezone: "UTC",
        dayCutoffTime: "04:00",
        version: 1,
      },
      `${FNC011_AUDIT_FAILURE_CASE.traceId}-prepare`,
    );

    await expect(
      settingsService.updateProfileSettings(
        FNC011_AUDIT_FAILURE_CASE.actorUserId,
        FNC011_AUDIT_FAILURE_CASE.input,
        FNC011_AUDIT_FAILURE_CASE.traceId,
      ),
    ).rejects.toMatchObject({
      code: FNC011_AUDIT_FAILURE_CASE.expectedErrorCode,
      traceId: `trace-${FNC011_AUDIT_FAILURE_CASE.traceId}`,
    });

    const rows = await opsRepository.queryAuditLogsForReport({
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-12-31T23:59:59.999Z",
      actions: ["SETTINGS_UPDATE"],
    });
    const failureAudit = rows.find((row) => row.traceId === `trace-${FNC011_AUDIT_FAILURE_CASE.traceId}`);

    expect(failureAudit).toBeDefined();
    expect(failureAudit?.result).toBe("failure");
    expect(failureAudit?.actorUserId).toBe(FNC011_AUDIT_FAILURE_CASE.actorUserId);
    expect(failureAudit?.targetId).toBe(FNC011_AUDIT_FAILURE_CASE.targetId);
    expect(failureAudit?.requirementId).toBe("FR-022");
    expect(failureAudit?.traceId).toBe(`trace-${FNC011_AUDIT_FAILURE_CASE.traceId}`);
    expect(failureAudit?.metadata.reason).toBe("settings update conflicted");
    expect(failureAudit?.metadata.error_code).toBe("DOMAIN_CONFLICT");
  });
});
