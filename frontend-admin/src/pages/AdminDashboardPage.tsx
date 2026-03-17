import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import type {
  AdminScope,
  AuditEntry,
  ManagedUser,
  SessionUser,
} from "../types";

const scopeOptions: AdminScope[] = [
  "USER_ADMIN",
  "SECURITY_ADMIN",
  "AUDIT_ADMIN",
  "ADMIN_ADMIN",
];
const roleOptions = ["PAYROLL_ADMIN", "COMPLIANCE_OFFICER", "AUDIT_ANALYST"];

export function AdminDashboardPage() {
  const { user, csrfToken, logout } = useAuth();
  const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
  const [recentAuditLogs, setRecentAuditLogs] = useState<AuditEntry[]>([]);
  const [message, setMessage] = useState("");
  const [userPasswords, setUserPasswords] = useState<Record<number, string>>(
    {},
  );
  const [employeeForm, setEmployeeForm] = useState({
    name: "",
    email: "",
    role: "PAYROLL_ADMIN",
  });
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    scopes: ["USER_ADMIN"] as AdminScope[],
    isSuperAdmin: false,
  });

  useEffect(() => {
    void refreshData();
  }, []);

  async function refreshData() {
    const [usersResponse, sessionResponse] = await Promise.all([
      axios.get("/api/admin/users"),
      axios.get("/api/admin/session"),
    ]);

    setManagedUsers(usersResponse.data.users);
    setRecentAuditLogs(sessionResponse.data.recentAuditLogs);
  }

  async function createEmployee(event: FormEvent) {
    event.preventDefault();
    const response = await axios.post("/api/admin/users", {
      ...employeeForm,
      _csrf: csrfToken,
    });
    setMessage(
      `Created ${response.data.user.email}. Temporary password: ${response.data.temporaryPassword}`,
    );
    setEmployeeForm({ name: "", email: "", role: "PAYROLL_ADMIN" });
    await refreshData();
  }

  async function createAdmin(event: FormEvent) {
    event.preventDefault();
    const response = await axios.post("/api/admin/admins", {
      ...adminForm,
      _csrf: csrfToken,
    });
    setMessage(
      `Created admin ${response.data.user.email}. Temporary password: ${response.data.temporaryPassword}`,
    );
    setAdminForm({
      name: "",
      email: "",
      scopes: ["USER_ADMIN"],
      isSuperAdmin: false,
    });
    await refreshData();
  }

  async function resetPassword(targetUser: ManagedUser) {
    try {
      const response = await axios.post(
        `/api/admin/users/${targetUser.id}/reset-password`,
        {
          _csrf: csrfToken,
        },
      );
      setUserPasswords((current) => ({
        ...current,
        [targetUser.id]: `New temporary password: ${response.data.temporaryPassword}`,
      }));
      await refreshData();
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Failed to reset password.");
    }
  }

  async function updateStatus(
    targetUser: ManagedUser,
    status: "Active" | "Suspended",
  ) {
    await axios.post(`/api/admin/users/${targetUser.id}/status`, {
      status,
      _csrf: csrfToken,
    });
    setMessage(`Updated ${targetUser.email} to ${status}.`);
    await refreshData();
  }

  async function viewPassword(targetUser: ManagedUser) {
    try {
      const response = await axios.get(
        `/api/admin/users/${targetUser.id}/password`,
      );
      setUserPasswords((current) => ({
        ...current,
        [targetUser.id]: `Current password: ${response.data.password}`,
      }));
    } catch (error: any) {
      setMessage(
        error.response?.data?.message || "Failed to retrieve password.",
      );
    }
  }

  async function onLogout() {
    await logout();
    window.location.href = "/login";
  }

  const adminUser = user as SessionUser;

  return (
    <main className="admin-dashboard-shell">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Secure admin portal</span>
          <h1>Account administration for Sankofa.</h1>
          <p>
            Signed in as {adminUser.name} ({adminUser.email}). Scopes:{" "}
            {adminUser.adminScopes.join(", ")}.
          </p>
        </div>
        <button onClick={onLogout} className="secondary-button" type="button">
          Log out
        </button>
      </header>

      {message ? <div className="banner">{message}</div> : null}

      <section className="admin-grid">
        <article className="panel">
          <h2>Create employee account</h2>
          <form className="admin-form" onSubmit={createEmployee}>
            <label>
              <span>Name</span>
              <input
                value={employeeForm.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                value={employeeForm.email}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setEmployeeForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                type="email"
                required
              />
            </label>
            <label>
              <span>Role</span>
              <select
                value={employeeForm.role}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setEmployeeForm((current) => ({
                    ...current,
                    role: event.target.value,
                  }))
                }
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <button type="submit">Create employee</button>
          </form>
        </article>

        <article className="panel">
          <h2>Create admin account</h2>
          <form className="admin-form" onSubmit={createAdmin}>
            <label>
              <span>Name</span>
              <input
                value={adminForm.name}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAdminForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                value={adminForm.email}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAdminForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                type="email"
                required
              />
            </label>
            <label>
              <span>Scopes</span>
              <select
                multiple
                value={adminForm.scopes}
                onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                  setAdminForm((current) => ({
                    ...current,
                    scopes: Array.from(event.target.selectedOptions).map(
                      (option: HTMLOptionElement) => option.value as AdminScope,
                    ),
                  }))
                }
              >
                {scopeOptions.map((scope) => (
                  <option key={scope} value={scope}>
                    {scope}
                  </option>
                ))}
              </select>
            </label>
            <label className="checkbox-row">
              <input
                checked={adminForm.isSuperAdmin}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setAdminForm((current) => ({
                    ...current,
                    isSuperAdmin: event.target.checked,
                  }))
                }
                type="checkbox"
              />
              <span>Grant super admin</span>
            </label>
            <button type="submit">Create admin</button>
          </form>
        </article>
      </section>

      <section className="panel">
        <h2>Managed accounts</h2>
        <div className="user-list">
          {managedUsers.map((managedUser) => (
            <article className="user-card" key={managedUser.id}>
              <div>
                <strong>{managedUser.name}</strong>
                <p>
                  {managedUser.email} | {managedUser.role} |{" "}
                  {managedUser.status}
                </p>
                <p>
                  {managedUser.isAdmin ? "Admin" : "Employee"}
                  {managedUser.isSuperAdmin ? " | Super admin" : ""}
                  {managedUser.adminScopes.length
                    ? ` | ${managedUser.adminScopes.join(", ")}`
                    : ""}
                </p>
                {userPasswords[managedUser.id] && (
                  <p
                    style={{
                      marginTop: "0.5rem",
                      fontWeight: "bold",
                      color: "var(--color-primary, #0056b3)",
                    }}
                  >
                    {userPasswords[managedUser.id]}
                  </p>
                )}
              </div>
              <div className="user-actions">
                {adminUser.isSuperAdmin && !managedUser.isAdmin && (
                  <button
                    type="button"
                    onClick={() => void viewPassword(managedUser)}
                  >
                    View password
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void resetPassword(managedUser)}
                >
                  Reset password
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void updateStatus(
                      managedUser,
                      managedUser.status === "Active" ? "Suspended" : "Active",
                    )
                  }
                >
                  {managedUser.status === "Active" ? "Suspend" : "Activate"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Recent admin audit trail</h2>
        <ul className="audit-list">
          {recentAuditLogs.map((entry) => (
            <li key={entry.id}>
              <strong>{entry.action}</strong>
              <span>{entry.description}</span>
              <small>
                {new Date(entry.createdAt).toLocaleString()} |{" "}
                {entry.actor.email}
              </small>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
