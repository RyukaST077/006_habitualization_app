import { HOME_TRANSITION_LINKS } from '../../client/routing/transition-map';
import { resolveRoutePath } from '../../client/routing/route-paths';
import { AppFooter } from '../../components/common/app-footer';
import { AppHeader } from '../../components/common/app-header';
import { AppScreenShell } from '../../components/common/app-screen-shell';
import { ErrorDisplay } from '../../components/common/error-display';
import type { CommonUiErrorDto } from '../../components/common/common-ui-types';

export default function HomePage() {
  const error: CommonUiErrorDto | null = {
    code: 'CHECKIN_CANCEL_NOT_ALLOWED',
    message: '当日外の取消はできません。今日の達成のみ取消できます。',
    status: 409,
  };

  return (
    <AppScreenShell
      title="SCR-002 ホーム"
      path="/home"
      header={<AppHeader />}
      footer={<AppFooter />}
    >
      <p>同意済みユーザーの到達先画面です。</p>
      <section aria-label="checkin state">
        <h2>checkin status</h2>
        <p>同日 duplicate checkin は idempotent=true として already checked in を表示します。</p>
      </section>
      <section aria-label="cancel checkin">
        <h2>チェックイン取消</h2>
        <p>当日達成のみ取消できます。APIは DELETE /api/checkins へ log_date を送信します。</p>
        <button type="button">取消（当日）</button>
        <button type="button" disabled>
          取消（当日外は不可）
        </button>
        <p>監査: CHECKIN_CANCEL success / failure</p>
      </section>
      <section aria-label="archived resume">
        <h2>archived habit guidance</h2>
        <p>archived の場合は SCR-004 習慣編集から再開してください。</p>
        <a href={resolveRoutePath('SCR-004', { habitId: 'archived-habit' })}>
          再開 (edit / SCR-004)
        </a>
      </section>
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
