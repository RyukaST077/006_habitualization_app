'use client';

import { useEffect, useMemo, useState } from 'react';

import {
  POLICY_CONSENT_TRANSITION,
  POLICY_REJECT_TRANSITION,
} from '../../client/routing/transition-map';
import { AppFooter } from '../../components/common/app-footer';
import { AppHeader } from '../../components/common/app-header';
import { AppScreenShell } from '../../components/common/app-screen-shell';

export default function PolicyConsentPage() {
  const [termsVersion, setTermsVersion] = useState('v1.0');
  const [privacyVersion, setPrivacyVersion] = useState('v1.0');
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    void (async () => {
      const response = await fetch('/api/policies/current', { method: 'GET' });
      if (!response.ok) {
        setFeedback('POLICY_UPDATE_FAILED');
        return;
      }

      const payload = (await response.json()) as {
        terms?: { policy_version?: string; currentVersion?: string };
        privacy?: { policy_version?: string; currentVersion?: string };
      };
      setTermsVersion(payload.terms?.policy_version ?? payload.terms?.currentVersion ?? 'v1.0');
      setPrivacyVersion(payload.privacy?.policy_version ?? payload.privacy?.currentVersion ?? 'v1.0');
    })();
  }, []);

  const consentsPayload = useMemo(
    () => [
      { policy_type: 'terms' as const, policy_version: termsVersion },
      { policy_type: 'privacy' as const, policy_version: privacyVersion },
    ],
    [privacyVersion, termsVersion],
  );

  async function handleAccept(): Promise<void> {
    const result = await fetch('/api/policies/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'accept',
        consents: consentsPayload,
        auditEvent: 'POLICY_CONSENT_ACCEPT',
      }),
    });

    if (!result.ok) {
      setFeedback('VERSION_CONFLICT');
      return;
    }

    window.location.href = POLICY_CONSENT_TRANSITION.href;
  }

  async function handleReject(): Promise<void> {
    await fetch('/api/policies/consents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'reject',
        consents: [],
        auditEvent: 'POLICY_CONSENT_REJECT',
      }),
    });
    window.location.href = POLICY_REJECT_TRANSITION.href;
  }

  return (
    <AppScreenShell
      title="SCR-008 ポリシー同意"
      path="/policy-consent"
      header={<AppHeader />}
      footer={<AppFooter />}
    >
      <p>サービス利用ポリシーに同意して続行してください。</p>
      {feedback ? <p role="alert">{feedback}</p> : null}
      <div>
        <button type="button" onClick={handleAccept}>
          同意して続行
        </button>
        <button type="button" onClick={handleReject}>
          同意しない
        </button>
      </div>
      <a href={POLICY_CONSENT_TRANSITION.href}>{POLICY_CONSENT_TRANSITION.label}</a>
      <a href={POLICY_REJECT_TRANSITION.href}>{POLICY_REJECT_TRANSITION.label}</a>
    </AppScreenShell>
  );
}
