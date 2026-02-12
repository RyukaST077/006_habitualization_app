import { POLICY_CONSENT_TRANSITION } from '../../client/routing/transition-map';

export default function PolicyConsentPage() {
  return (
    <main>
      <h1>SCR-008 ポリシー同意</h1>
      <p>/policy-consent</p>
      <a href={POLICY_CONSENT_TRANSITION.href}>{POLICY_CONSENT_TRANSITION.label}</a>
    </main>
  );
}
