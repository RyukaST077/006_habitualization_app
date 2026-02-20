import { resolveAppRoutePaths, resolveCommonUiRouteViewModels, type CommonUiRouteViewModel } from "./app/router";

export type AppShell = {
  name: "habitualization-app";
  routes: readonly string[];
  commonUiRoutes: readonly CommonUiRouteViewModel[];
};

export function createAppShell(): AppShell {
  const routes = resolveAppRoutePaths();

  return {
    name: "habitualization-app",
    routes,
    commonUiRoutes: resolveCommonUiRouteViewModels(routes),
  };
}
