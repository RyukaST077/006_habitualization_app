import type { ScreenContainerProps } from "./types";

const CONSENT_REQUIREMENT_ID = "FR-026" as const;
const POLICY_CONSENT_ACCEPT = "POLICY_CONSENT_ACCEPT" as const;
const POLICY_CONSENT_REJECT = "POLICY_CONSENT_REJECT" as const;

export type PolicyConsentAuditTrace = {
  action: typeof POLICY_CONSENT_ACCEPT | typeof POLICY_CONSENT_REJECT;
  requirementId: typeof CONSENT_REQUIREMENT_ID;
  metadata: {
    policyTypes: readonly ["terms", "privacy"];
  };
};

export type PolicyConsentPageHandlers = {
  onAccept?: (trace: PolicyConsentAuditTrace) => void;
  onReject?: (trace: PolicyConsentAuditTrace) => void;
};

type ConsentCheckboxKey = "terms" | "privacy";
type ConsentState = Record<ConsentCheckboxKey, boolean>;

const REQUIRED_POLICIES = ["terms", "privacy"] as const;

export function SCR008PolicyConsentPage({
  screenId,
  handlers,
}: ScreenContainerProps & { handlers?: PolicyConsentPageHandlers }) {
  const consentState: ConsentState = {
    terms: false,
    privacy: false,
  };

  const audit = {
    accept: {
      action: POLICY_CONSENT_ACCEPT,
    },
    reject: {
      action: POLICY_CONSENT_REJECT,
    },
    requirementId: CONSENT_REQUIREMENT_ID,
  } as const;

  const createTrace = (action: PolicyConsentAuditTrace["action"]): PolicyConsentAuditTrace => ({
    action,
    requirementId: CONSENT_REQUIREMENT_ID,
    metadata: {
      policyTypes: REQUIRED_POLICIES,
    },
  });

  const isAcceptEnabled = () => consentState.terms && consentState.privacy;

  return {
    screenId,
    ui: {
      terms: {
        get checked() {
          return consentState.terms;
        },
      },
      privacy: {
        get checked() {
          return consentState.privacy;
        },
      },
      acceptButton: {
        requires: REQUIRED_POLICIES,
        get disabled() {
          return !isAcceptEnabled();
        },
      },
    },
    audit,
    actions: {
      setTermsChecked: (checked: boolean) => {
        consentState.terms = checked;
      },
      setPrivacyChecked: (checked: boolean) => {
        consentState.privacy = checked;
      },
      accept: (): any => {
        if (!isAcceptEnabled()) {
          return false;
        }
        const trace = createTrace(POLICY_CONSENT_ACCEPT);
        handlers?.onAccept?.(trace);
        return trace;
      },
      reject: (): any => {
        const trace = createTrace(POLICY_CONSENT_REJECT);
        handlers?.onReject?.(trace);
        return trace;
      },
    },
  };
}
