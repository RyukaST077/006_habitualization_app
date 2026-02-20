import type { ScreenContainerProps } from "./types";

export type AnalyticsPageHandlers = {
  onBackHome?: () => void;
};

const SCR006_UNAVAILABLE_NOTICE = {
  title: "分析機能は準備中です",
  reason: "この機能は現在未実装のため、表示できません。",
  fallback: "ホームに戻る",
} as const;

const SCR006_MOCK_PLACEHOLDERS = [
  { key: "period", label: "期間選択", value: "今週（仮）" },
  { key: "achievementRate", label: "達成率", value: "--%" },
  { key: "longestStreak", label: "最長ストリーク", value: "--日" },
] as const;

export function SCR006AnalyticsPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: AnalyticsPageHandlers }) {
  return {
    screenId,
    isOptionalFeature: true as const,
    mockLabel: "モック画面",
    // TODO:REMOVE_MOCK(S-MOCK-04): FNC-008可視化API安定化（Phase5: T-068/T-069）後に実データ表示へ置換する
    unavailableNotice: SCR006_UNAVAILABLE_NOTICE,
    placeholders: SCR006_MOCK_PLACEHOLDERS,
    actions: {
      isBackHomeEnabled: true as const,
      backHomeLabel: "ホームに戻る",
      backHome: () => handlers?.onBackHome?.(),
    },
  };
}
