import { PropsWithChildren } from 'react';

interface ScreenShellProps {
  title: string;
  subtitle?: string;
}

export function ScreenShell({ title, subtitle, children }: PropsWithChildren<ScreenShellProps>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col p-4 text-arena-text">
      <header className="mb-4 rounded-2xl border border-white/10 bg-arena-panel/80 p-4 shadow-neon backdrop-blur">
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
