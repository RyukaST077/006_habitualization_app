import { AUTH_CONSENT_ROUTES, BUSINESS_ROUTES, type CommonUiRouteViewModel, resolveCommonUiRouteViewModel } from "./app/router";

export type AppShell = {
  name: "habitualization-app";
  routes: readonly string[];
  commonUiRoutes: readonly CommonUiRouteViewModel[];
};

export function createAppShell(): AppShell {
  const routes = [...AUTH_CONSENT_ROUTES, ...BUSINESS_ROUTES].map((route) => route.path);

  return {
    name: "habitualization-app",
    routes,
    commonUiRoutes: routes.map((routePath) => resolveCommonUiRouteViewModel(routePath)),
  };
}
