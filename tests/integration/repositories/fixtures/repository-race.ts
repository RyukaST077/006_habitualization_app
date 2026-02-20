export interface RepositoryRaceParticipant {
  readonly name: string;
  run(): Promise<unknown>;
}

export interface RepositoryRaceResult {
  readonly name: string;
  readonly status: "fulfilled" | "rejected";
  readonly value?: unknown;
  readonly reason?: unknown;
}

/**
 * 疑似並行で複数の repository 操作を実行し、順序依存しない結果比較を可能にする。
 */
export async function runRepositoryRace(
  participants: readonly RepositoryRaceParticipant[],
): Promise<RepositoryRaceResult[]> {
  const settled = await Promise.allSettled(participants.map((participant) => participant.run()));

  return settled.map((result, index) => {
    const name = participants[index]?.name ?? `participant-${index}`;
    if (result.status === "fulfilled") {
      return {
        name,
        status: "fulfilled",
        value: result.value,
      };
    }

    return {
      name,
      status: "rejected",
      reason: result.reason,
    };
  });
}
