import { AppHeader } from '../../components/common/app-header';
import { ErrorDisplay } from '../../components/common/error-display';
import type { CommonUiErrorDto } from '../../components/common/common-ui-types';

export default function SettingsPage() {
  const error: CommonUiErrorDto | null = null;

  return (
    <main>
      <AppHeader />
      <h1>SCR-007 設定</h1>
      <p>/settings</p>
      <ErrorDisplay error={error} />
    </main>
  );
}
