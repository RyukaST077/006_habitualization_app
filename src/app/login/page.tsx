'use client';

import { useState } from 'react';

import { LOGIN_TO_CONSENT_TRANSITION } from '../../client/routing/transition-map';

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleGoogleLogin(): Promise<void> {
    setIsLoading(true);
    setErrorMessage(null);

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
        const fallback = '認証開始に失敗しました。Googleでログインを再試行してください。';
        const detailed = body.errorCode ? ERROR_MESSAGES[body.errorCode] : fallback;
        const traceSuffix = body.trace_id ? ` (trace_id: ${body.trace_id})` : '';
        setErrorMessage(`${detailed}${traceSuffix}`);
        return;
      }

      window.location.href = LOGIN_TO_CONSENT_TRANSITION.href;
    } catch {
      setErrorMessage('通信エラーが発生しました。ネットワークを確認して再試行してください。');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      <h1>SCR-001 ログイン</h1>
      <p>/login</p>
      <button type="button" onClick={handleGoogleLogin} disabled={isLoading}>
        {isLoading ? 'ログイン中...' : 'Googleでログイン'}
      </button>
      {errorMessage ? <p role="alert">{errorMessage}</p> : null}
    </main>
  );
}
