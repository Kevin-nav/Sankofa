export const AUTH_ROLE_OPTIONS = [
  { value: 'PAYROLL_ADMIN', label: 'Payroll Admin' },
  { value: 'COMPLIANCE_OFFICER', label: 'Compliance Officer' },
  { value: 'AUDIT_ANALYST', label: 'Audit Analyst' },
] as const;

export type AuthRole = (typeof AUTH_ROLE_OPTIONS)[number]['value'];

const ROLE_LABELS: Record<AuthRole, string> = {
  PAYROLL_ADMIN: 'Payroll Admin',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  AUDIT_ANALYST: 'Audit Analyst',
};

export function formatRoleLabel(role: string | undefined): string {
  if (!role) {
    return 'Unassigned';
  }

  return ROLE_LABELS[role as AuthRole] ?? role.replaceAll('_', ' ').toLowerCase();
}
