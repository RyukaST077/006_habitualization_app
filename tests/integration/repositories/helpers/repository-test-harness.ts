export interface RepositoryTestHarness {
  setup(): Promise<void>;
  cleanup(): Promise<void>;
}

export function createRepositoryTestHarness(): RepositoryTestHarness {
  return {
    async setup(): Promise<void> {
      // TODO(T-025): 実DB接続/seed処理を追加する
    },
    async cleanup(): Promise<void> {
      // TODO(T-025): トランザクションロールバック/データ後始末を追加する
    },
  };
}
