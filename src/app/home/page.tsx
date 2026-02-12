import { HOME_TRANSITION_LINKS } from '../../client/routing/transition-map';
import { AppFooter } from '../../components/common/app-footer';
import { AppHeader } from '../../components/common/app-header';
import { AppScreenShell } from '../../components/common/app-screen-shell';
import { ErrorDisplay } from '../../components/common/error-display';
import type { CommonUiErrorDto } from '../../components/common/common-ui-types';

export default function HomePage() {
  const error: CommonUiErrorDto | null = null;

  return (
    <AppScreenShell
      title="SCR-002 ホーム"
      path="/home"
      header={<AppHeader />}
      footer={<AppFooter />}
    >
      <p>同意済みユーザーの到達先画面です。</p>
      <nav aria-label="SCR-002 normal transitions">
        <ul>
          {HOME_TRANSITION_LINKS.map((link) => (
            <li key={`${link.from}-${link.to}`}>
              <a href={link.href}>{link.label}</a>
            </li>
          ))}
        </ul>
      </nav>
      <ErrorDisplay error={error} />
    </AppScreenShell>
  );
}
