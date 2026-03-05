import { describe, expect, it, vi } from "vitest";

import { ROUTE_MAP } from "../../../src/app/route-map";
import {
  requestSettingsProfileRuntime,
  requestSettingsProfileSaveRuntime,
  requestSettingsWithdrawalRuntime,
} from "../../../src/main";
import { SCR007SettingsPage } from "../../../src/screens/SCR-007SettingsPage";
import {
  SCR007_RUNTIME_ERROR_CASES,
  SCR007_RUNTIME_INITIAL_PROFILE,
  SCR007_RUNTIME_PROFILE_ENDPOINT,
  SCR007_RUNTIME_UPDATED_PROFILE,
  SCR007_RUNTIME_USER_ID,
  SCR007_RUNTIME_WITHDRAWAL_ENDPOINT,
  SCR007_TRACEABILITY_IDS,
  SCR007_UI_REQUIREMENT_TRACE_CASES,
  SCR007_WITHDRAWAL_UI_BOUNDARY,
  T056_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-056 C-004 SCR-007 settings runtime regression", () => {
  it("/settings で初期読込し、GET /api/settings/profile を実行する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        profile: {
          timezone: SCR007_RUNTIME_INITIAL_PROFILE.timezone,
          day_cutoff_time: SCR007_RUNTIME_INITIAL_PROFILE.dayCutoffTime,
        },
      }),
    } as Response);

    const result = await requestSettingsProfileRuntime(fetchMock, SCR007_RUNTIME_USER_ID);

    expect(ROUTE_MAP["SCR-007"]).toBe("/settings");
    expect(fetchMock).toHaveBeenCalledWith(
      `${SCR007_RUNTIME_PROFILE_ENDPOINT}?userId=${SCR007_RUNTIME_USER_ID}`,
      expect.objectContaining({ method: "GET", cache: "no-store" }),
    );
    expect(result).toEqual({
      kind: "success",
      profile: SCR007_RUNTIME_INITIAL_PROFILE,
    });
  });

  it("保存時に PATCH /api/settings/profile を実行し、成功時に dirty を解消する", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        profile: {
          timezone: SCR007_RUNTIME_UPDATED_PROFILE.timezone,
          day_cutoff_time: SCR007_RUNTIME_UPDATED_PROFILE.dayCutoffTime,
        },
      }),
    } as Response);

    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      initialProfile: SCR007_RUNTIME_INITIAL_PROFILE,
      handlers: {
        onSaveSettings: (input) => requestSettingsProfileSaveRuntime(fetchMock, input, SCR007_RUNTIME_USER_ID),
      },
    });

    page.actions.setTimezone(SCR007_RUNTIME_UPDATED_PROFILE.timezone);
    page.actions.setDayCutoffTime(SCR007_RUNTIME_UPDATED_PROFILE.dayCutoffTime);

    const saved = await page.actions.save();

    expect(saved.kind).toBe("success");
    expect(fetchMock).toHaveBeenCalledWith(
      SCR007_RUNTIME_PROFILE_ENDPOINT,
      expect.objectContaining({
        method: "PATCH",
        headers: { "content-type": "application/json" },
      }),
    );

    const requestBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(requestBody).toEqual({
      userId: SCR007_RUNTIME_USER_ID,
      timezone: SCR007_RUNTIME_UPDATED_PROFILE.timezone,
      day_cutoff_time: SCR007_RUNTIME_UPDATED_PROFILE.dayCutoffTime,
    });
    expect(page.ui.save.isDirty).toBe(false);
    expect(page.ui.save.isEnabled).toBe(false);
  });

  it("400/409/500 と通信失敗をエラーへマッピングし、500 は trace_id を表示する", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: false,
        status: SCR007_RUNTIME_ERROR_CASES[0].status,
        json: async () => ({ code: SCR007_RUNTIME_ERROR_CASES[0].code }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: SCR007_RUNTIME_ERROR_CASES[1].status,
        json: async () => ({ code: SCR007_RUNTIME_ERROR_CASES[1].code }),
      } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: SCR007_RUNTIME_ERROR_CASES[2].status,
        json: async () => ({ code: SCR007_RUNTIME_ERROR_CASES[2].code, trace_id: "trace-settings-500" }),
      } as Response)
      .mockRejectedValueOnce(new Error("network error"));

    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      initialProfile: SCR007_RUNTIME_INITIAL_PROFILE,
      handlers: {
        onSaveSettings: (input) => requestSettingsProfileSaveRuntime(fetchMock, input, SCR007_RUNTIME_USER_ID),
      },
    });

    page.actions.setTimezone(SCR007_RUNTIME_UPDATED_PROFILE.timezone);

    const error400 = await page.actions.save();
    expect(error400.kind).toBe("error");
    if (error400.kind !== "error") {
      throw new Error("expected 400 error");
    }
    expect(error400.error.status).toBe(400);
    expect(error400.error.code).toBe("VALIDATION_ERROR");

    const error409 = await page.actions.retrySave();
    expect(error409.kind).toBe("error");
    if (error409.kind !== "error") {
      throw new Error("expected 409 error");
    }
    expect(error409.error.status).toBe(409);
    expect(error409.error.code).toBe("DOMAIN_CONFLICT");

    const error500 = await page.actions.retrySave();
    expect(error500.kind).toBe("error");
    if (error500.kind !== "error") {
      throw new Error("expected 500 error");
    }
    expect(error500.error.status).toBe(500);
    expect(error500.error.visibleTraceId).toBe("trace_id:trace-settings-500");

    const errorNetwork = await page.actions.retrySave();
    expect(errorNetwork.kind).toBe("error");
    if (errorNetwork.kind !== "error") {
      throw new Error("expected network error");
    }
    expect(errorNetwork.error.status).toBe(500);
    expect(errorNetwork.error.code).toBe("INTERNAL_ERROR");
  });

  it("退会2段階確認完了時に POST /api/settings/withdrawal を呼び、失敗時は再試行可能", async () => {
    // T-029 boundary: 退会SLA(60秒不可化/5分削除)とジョブ監視は回帰条件に含めず、UI導線のみ固定する。
    expect(SCR007_WITHDRAWAL_UI_BOUNDARY.nonUiResponsibilities).toEqual([
      "60秒不可化/5分削除SLAの計測",
      "account_deletion_jobs の状態監視/再実行",
    ]);

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ code: "INTERNAL_ERROR", trace_id: "trace-withdraw-500" }),
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({}),
      } as Response);

    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      handlers: {
        onWithdraw: () => requestSettingsWithdrawalRuntime(fetchMock, SCR007_RUNTIME_USER_ID),
      },
    });

    page.actions.openWithdrawalModal();
    page.actions.advanceWithdrawalConfirmStep();

    const failed = await page.actions.executeWithdrawal();
    expect(failed.kind).toBe("error");
    if (failed.kind !== "error") {
      throw new Error("expected withdrawal error");
    }
    expect(failed.status).toBe(500);
    expect(page.ui.withdrawal.isModalOpen).toBe(true);

    const retried = await page.actions.executeWithdrawal();
    expect(retried.kind).toBe("success");
    expect(page.ui.withdrawal.isModalOpen).toBe(false);
    expect(fetchMock.mock.calls.map(([url]) => String(url))).toEqual([
      SCR007_RUNTIME_WITHDRAWAL_ENDPOINT,
      SCR007_RUNTIME_WITHDRAWAL_ENDPOINT,
    ]);
  });

  it("FR-019..024 / AC-019..022 / SCR-007 のトレースと C-004 完了ゲートを固定する", () => {
    expect(SCR007_TRACEABILITY_IDS).toEqual([
      "FR-019",
      "FR-020",
      "FR-021",
      "FR-022",
      "FR-023",
      "FR-024",
      "AC-019",
      "AC-020",
      "AC-021",
      "AC-022",
      "SCR-007",
    ]);
    expect(SCR007_UI_REQUIREMENT_TRACE_CASES).toHaveLength(10);
    expect(T056_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts && npm run typecheck",
    ]);
  });
});
