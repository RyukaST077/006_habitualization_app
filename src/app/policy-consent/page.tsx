'use client';

import {
  POLICY_CONSENT_TRANSITION,
  POLICY_REJECT_TRANSITION,
} from '../../client/routing/transition-map';

export default function PolicyConsentPage() {
  function handleAccept(): void {
    window.location.href = POLICY_CONSENT_TRANSITION.href;
  }

  function handleReject(): void {
    window.location.href = POLICY_REJECT_TRANSITION.href;
  }

  return (
    <main>
      <h1>SCR-008 ポリシー同意</h1>
      <p>/policy-consent</p>
      <p>サービス利用ポリシーに同意して続行してください。</p>
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
    </main>
  );
}
