import { describe, expect, it, vi } from "vitest";

import { SCR007SettingsPage } from "../../../src/screens/SCR-007SettingsPage";
import {
  SCR007_CONFIRMATION_STEP_SEQUENCE,
  SCR007_DAY_CUTOFF_TIME_BOUNDARIES,
  SCR007_IANA_TIMEZONE_OPTIONS,
  SCR007_TRACEABILITY_IDS,
  SCR007_UI_REQUIREMENT_TRACE_CASES,
  SCR007_WITHDRAWAL_UI_BOUNDARY,
  T062_C001_COMPLETION_GATE_COMMANDS,
  T062_C002_COMPLETION_GATE_COMMANDS,
  T062_C003_COMPLETION_GATE_COMMANDS,
  T062_LOGOUT_TRACEABILITY_IDS,
  T062_LOGOUT_UI_REQUIREMENT_TRACE_CASES,
  T056_C004_COMPLETION_GATE_COMMANDS,
} from "../../helpers/ui/common-ui-fixtures";

describe("T-056 C-004 SCR-007 settings page regression gate", () => {
  it("FR-019..024 / AC-019..022 / SCR-007 の最終トレースを固定する", () => {
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
  });

  it("T-062: ログアウト回帰のトレース観点を固定する", () => {
    expect(T062_LOGOUT_TRACEABILITY_IDS).toEqual([
      "FR-004",
      "AC-004",
      "SCR-007",
      "SCR-001",
      "IF-001",
    ]);
    expect(T062_LOGOUT_UI_REQUIREMENT_TRACE_CASES).toHaveLength(3);
    expect(T062_C001_COMPLETION_GATE_COMMANDS).toEqual([
      "rg -n \"T-062|FR-004|AC-004|settings-logout|ログアウト回帰\" tests/helpers/ui/common-ui-fixtures.ts tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts",
    ]);
  });

  it("T-062: logout アクションは callback 経由の結果を画面モデルへ返す", async () => {
    const onLogout = vi.fn().mockResolvedValue({
      kind: "success",
      route: "SCR-001",
    } as const);
    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      handlers: {
        onLogout,
      },
    });

    const result = await page.actions.logout();
    expect(result).toEqual({
      kind: "success",
      route: "SCR-001",
    });
    expect(onLogout).toHaveBeenCalledTimes(1);
    expect(T062_C002_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/integration/ui/scr-007-settings-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts",
    ]);
  });

  it("T-062: C-003 の最終回帰ゲートコマンドを固定する", () => {
    expect(T062_C003_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts && npm run typecheck",
    ]);
  });

  it("初期値と編集値の差分で保存活性を制御する", () => {
    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      timezoneOptions: SCR007_IANA_TIMEZONE_OPTIONS,
      initialProfile: {
        timezone: "Asia/Tokyo",
        dayCutoffTime: "06:00",
      },
    });

    expect(page.commonUi.routePath).toBe("/settings");
    expect(page.ui.save.isDirty).toBe(false);
    expect(page.ui.save.isEnabled).toBe(false);

    page.actions.setDayCutoffTime("06:30");
    expect(page.ui.save.isDirty).toBe(true);
    expect(page.ui.save.isEnabled).toBe(true);

    page.actions.setDayCutoffTime("06:00");
    expect(page.ui.save.isDirty).toBe(false);
    expect(page.ui.save.isEnabled).toBe(false);
  });

  it("timezone は IANA 候補のみ、day_cutoff_time は HH:mm(00:00-23:59) を許容する", () => {
    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      timezoneOptions: SCR007_IANA_TIMEZONE_OPTIONS,
    });

    page.actions.setTimezone("Invalid/Zone");
    expect(page.ui.form.errors.timezone).toBe("IANAタイムゾーンを選択してください");
    expect(page.ui.save.isEnabled).toBe(false);

    page.actions.setTimezone("UTC");
    expect(page.ui.form.errors.timezone).toBeNull();

    for (const testCase of SCR007_DAY_CUTOFF_TIME_BOUNDARIES) {
      page.actions.setDayCutoffTime(testCase.value);
      expect(page.ui.form.errors.dayCutoffTime === null).toBe(testCase.valid);
    }
  });

  it("保存実行中は二重送信を抑止し、成功時にdirtyを解消する", async () => {
    let resolvePending:
      | ((value: { kind: "success"; profile: { timezone: string; dayCutoffTime: string } }) => void)
      | undefined;
    const onSaveSettings = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePending = resolve;
          }),
      )
      .mockResolvedValueOnce({
        kind: "success",
        profile: {
          timezone: "UTC",
          dayCutoffTime: "07:30",
        },
      });

    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      timezoneOptions: SCR007_IANA_TIMEZONE_OPTIONS,
      initialProfile: {
        timezone: "Asia/Tokyo",
        dayCutoffTime: "07:00",
      },
      handlers: { onSaveSettings },
    });

    page.actions.setTimezone("UTC");
    page.actions.setDayCutoffTime("07:30");

    const first = page.actions.save();
    const second = page.actions.save();
    expect(page.ui.save.isSubmitting).toBe(true);
    expect(onSaveSettings).toHaveBeenCalledTimes(1);

    if (typeof resolvePending !== "function") {
      throw new Error("resolvePending was not assigned");
    }

    resolvePending({
      kind: "success",
      profile: {
        timezone: "UTC",
        dayCutoffTime: "07:30",
      },
    });

    const [firstResult, secondResult] = await Promise.all([first, second]);
    expect(firstResult.kind).toBe("success");
    expect(secondResult.kind).toBe("success");
    expect(page.ui.save.isSubmitting).toBe(false);
    expect(page.ui.save.isDirty).toBe(false);
    expect(page.ui.save.isEnabled).toBe(false);
  });

  it("退会は2段階確認モーダル完了時のみ実行ハンドラを呼ぶ", async () => {
    // T-029 boundary: 退会SLA計測と account_deletion_jobs 監視はバックエンド責務で、この回帰テストでは扱わない。
    expect(SCR007_WITHDRAWAL_UI_BOUNDARY.nonUiResponsibilities).toEqual([
      "60秒不可化/5分削除SLAの計測",
      "account_deletion_jobs の状態監視/再実行",
    ]);

    const onWithdraw = vi.fn().mockResolvedValue({ kind: "success" });
    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      handlers: { onWithdraw },
    });

    expect(page.ui.withdrawal.isModalOpen).toBe(SCR007_CONFIRMATION_STEP_SEQUENCE.initial.isOpen);
    expect(page.ui.withdrawal.confirmStep).toBe(SCR007_CONFIRMATION_STEP_SEQUENCE.initial.step);

    const beforeOpen = await page.actions.executeWithdrawal();
    expect(beforeOpen.kind).toBe("error");
    expect(onWithdraw).toHaveBeenCalledTimes(0);

    page.actions.openWithdrawalModal();
    expect(page.ui.withdrawal.isModalOpen).toBe(SCR007_CONFIRMATION_STEP_SEQUENCE.opened.isOpen);
    expect(page.ui.withdrawal.confirmStep).toBe(SCR007_CONFIRMATION_STEP_SEQUENCE.opened.step);

    const beforeSecondStep = await page.actions.executeWithdrawal();
    expect(beforeSecondStep.kind).toBe("error");
    expect(onWithdraw).toHaveBeenCalledTimes(0);

    page.actions.advanceWithdrawalConfirmStep();
    expect(page.ui.withdrawal.confirmStep).toBe(SCR007_CONFIRMATION_STEP_SEQUENCE.confirmedStep1.step);

    const confirmed = await page.actions.executeWithdrawal();
    expect(confirmed.kind).toBe("success");
    expect(onWithdraw).toHaveBeenCalledTimes(1);
    expect(page.ui.withdrawal.isModalOpen).toBe(SCR007_CONFIRMATION_STEP_SEQUENCE.closed.isOpen);
    expect(page.ui.withdrawal.confirmStep).toBe(SCR007_CONFIRMATION_STEP_SEQUENCE.closed.step);
  });

  it("保存失敗時はエラー状態と再試行アクションを返す", async () => {
    const page = SCR007SettingsPage({
      screenId: "SCR-007",
      timezoneOptions: SCR007_IANA_TIMEZONE_OPTIONS,
      initialProfile: {
        timezone: "Asia/Tokyo",
        dayCutoffTime: "08:00",
      },
      handlers: {
        onSaveSettings: vi.fn().mockResolvedValue({
          kind: "error",
          status: 409,
          code: "DOMAIN_CONFLICT",
        }),
      },
    });

    page.actions.setTimezone("UTC");
    const failed = await page.actions.save();

    expect(failed.kind).toBe("error");
    if (failed.kind !== "error") {
      throw new Error("expected error result");
    }
    expect(page.ui.error.isVisible).toBe(true);
    expect(failed.error.status).toBe(409);
    expect(failed.retryAction.label).toBe("再試行");
  });

  it("完了ゲート: C-004 の最終ゲートコマンドを固定する", () => {
    expect(T056_C004_COMPLETION_GATE_COMMANDS).toEqual([
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts",
      "npm run test -- tests/unit/screens/scr-007-settings-page-red.spec.ts tests/integration/ui/scr-007-settings-runtime-red.spec.ts tests/integration/api/if-002-settings-profile-red.spec.ts && npm run typecheck",
    ]);
  });
});
