import { createAppShell } from "./App";

export function bootstrapApp() {
  return createAppShell();
}

function renderAppShell() {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.querySelector<HTMLDivElement>("#app");
  if (!root) {
    return;
  }

  const app = bootstrapApp();
  const routeList = app.routes.map((route) => `<li>${route}</li>`).join("");
  root.innerHTML = `
    <main style="font-family: sans-serif; max-width: 720px; margin: 32px auto; padding: 16px;">
      <h1>${app.name}</h1>
      <p>Vite development server is running.</p>
      <h2>Routes</h2>
      <ul>${routeList}</ul>
    </main>
  `;
}

renderAppShell();
