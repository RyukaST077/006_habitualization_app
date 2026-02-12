import { AppFooter } from '../../components/common/app-footer';
import { AppHeader } from '../../components/common/app-header';
import { AppScreenShell } from '../../components/common/app-screen-shell';
import { ErrorDisplay } from '../../components/common/error-display';
import type { CommonUiErrorDto } from '../../components/common/common-ui-types';

export default function SettingsPage() {
  const error: CommonUiErrorDto | null = null;

  return (
    <AppScreenShell
      title="SCR-007 設定"
      path="/settings"
      header={<AppHeader />}
      footer={<AppFooter />}
    >
      <ErrorDisplay error={error} />
    </AppScreenShell>
  );
}
