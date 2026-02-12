import type { ReactNode } from 'react';

type AppScreenShellProps = {
  title: string;
  path: string;
  header: ReactNode;
  footer: ReactNode;
  children?: ReactNode;
};

export function AppScreenShell({ title, path, header, footer, children }: AppScreenShellProps) {
  return (
    <main>
      {header}
      <h1>{title}</h1>
      <p>{path}</p>
      {children}
      {footer}
    </main>
  );
}
