import type { ReactNode } from 'react';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  panelTitle: string;
  panelDescription: string;
  footer: ReactNode;
  children: ReactNode;
};

const highlights = [
  {
    label: 'Session security',
    value: 'CSRF-protected internal access',
  },
  {
    label: 'Role-aware workspace',
    value: 'Payroll, compliance, and audit routing',
  },
  {
    label: 'Operational visibility',
    value: 'Dashboard cards and live activity context',
  },
];

export function AuthShell({
  eyebrow,
  title,
  description,
  panelTitle,
  panelDescription,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <span className="auth-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p className="auth-copy">{description}</p>

        <div className="auth-highlights">
          {highlights.map((item) => (
            <article className="auth-highlight-card" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-header">
          <h2>{panelTitle}</h2>
          <p>{panelDescription}</p>
        </div>
        {children}
        <div className="auth-panel-footer">{footer}</div>
      </section>
    </div>
  );
}
