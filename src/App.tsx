import { AUTH_CONSENT_ROUTES, BUSINESS_ROUTES } from "./app/router";

export type AppShell = {
  name: "habitualization-app";
  routes: readonly string[];
};

export function createAppShell(): AppShell {
  return {
    name: "habitualization-app",
    routes: [...AUTH_CONSENT_ROUTES, ...BUSINESS_ROUTES].map((route) => route.path),
  };
}

