'use client';

import { useState } from 'react';

import { LOGIN_TO_CONSENT_TRANSITION } from '../../client/routing/transition-map';
import { AppFooter } from '../../components/common/app-footer';
import { AppHeader } from '../../components/common/app-header';
import { AppScreenShell } from '../../components/common/app-screen-shell';
import { ErrorDisplay } from '../../components/common/error-display';
import type { CommonUiErrorDto } from '../../components/common/common-ui-types';

type AuthStartResponse = {
  auth_url?: string;
  trace_id?: string;
  errorCode?: 'INVALID_REDIRECT' | 'AUTH_FAILED' | 'AUTH_PROVIDER_ERROR';
};

const ERROR_MESSAGES: Record<NonNullable<AuthStartResponse['errorCode']>, string> = {
  INVALID_REDIRECT: '遷移先の指定が不正です。もう一度お試しください。',
  AUTH_FAILED: '認証に失敗しました。時間をおいて再試行してください。',
  AUTH_PROVIDER_ERROR: '外部認証サービスで障害が発生しています。しばらく待って再試行してください。',
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<CommonUiErrorDto | null>(null);

  async function handleGoogleLogin(): Promise<void> {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/google/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ redirectTo: '/home' }),
      });

      const body = (await response.json()) as AuthStartResponse;

      if (!response.ok || !body.auth_url || !body.trace_id) {
        const errorCode = body.errorCode ?? 'AUTH_FAILED';
        const statusByErrorCode: Record<NonNullable<AuthStartResponse['errorCode']>, 400 | 403 | 500> = {
          INVALID_REDIRECT: 400,
          AUTH_FAILED: 403,
          AUTH_PROVIDER_ERROR: 500,
        };
        const status = statusByErrorCode[errorCode];

        setError({
          code: errorCode,
          message: ERROR_MESSAGES[errorCode],
          trace_id: body.trace_id,
          requirement_id: 'SCR-COM-3.2',
          status,
        });
        return;
      }

      window.location.href = LOGIN_TO_CONSENT_TRANSITION.href;
    } catch {
      setError({
        code: 'NETWORK_ERROR',
        message: '通信エラーが発生しました。ネットワークを確認して再試行してください。',
        requirement_id: 'SCR-COM-3.2',
        status: 500,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AppScreenShell
      title="SCR-001 ログイン"
      path="/login"
      header={<AppHeader />}
      footer={<AppFooter />}
    >
      <button type="button" onClick={handleGoogleLogin} disabled={isLoading}>
        {isLoading ? 'ログイン中...' : 'Googleでログイン'}
      </button>
      <div role="alert">
        <ErrorDisplay error={error} />
      </div>
    </AppScreenShell>
  );
}
