import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  screenId: string;
  children: ReactNode;
};

export function PageShell({ title, screenId, children }: PageShellProps) {
  return (
    <section>
      <header className="mb-6">
        <h1 className="font-display text-[32px] font-semibold leading-10 tracking-[-0.01em] text-foreground">
          {title}
        </h1>
        <p className="mt-1 font-mono text-[11px] tracking-[0.02em] text-muted-foreground" translate="no">
          {screenId}
        </p>
      </header>
      {children}
    </section>
  );
}
