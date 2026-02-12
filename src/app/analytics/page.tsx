import { AppFooter } from '../../components/common/app-footer';
import { AppHeader } from '../../components/common/app-header';
import { ErrorDisplay } from '../../components/common/error-display';
import type { CommonUiErrorDto } from '../../components/common/common-ui-types';

export default function AnalyticsPage() {
  const error: CommonUiErrorDto | null = null;

  return (
    <main>
      <AppHeader />
      <h1>SCR-006 分析</h1>
      <p>/analytics</p>
      <p>任意機能（モック）として表示しています。可視化API連携は準備中です。</p>
      <section aria-label="SCR-006 mock summary">
        <h2>モック表示項目</h2>
        <ul>
          <li>期間選択: 直近7日（固定）</li>
          <li>達成率: --%</li>
          <li>最長ストリーク: --日</li>
        </ul>
      </section>
      <ErrorDisplay error={error} />
      <AppFooter />
    </main>
  );
}
