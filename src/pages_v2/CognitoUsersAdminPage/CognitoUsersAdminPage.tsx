import { useEffect, useMemo, useState } from "react";
import {
  disableCognitoUserAdmin,
  enableCognitoUserAdmin,
  fetchCognitoUsersAdmin,
  getCognitoUserAdmin,
  inviteCognitoUserAdmin,
  resetCognitoUserPasswordAdmin,
  updateCognitoUserAdmin,
  type AdminCognitoUser,
  type AdminCognitoUserDetail,
} from "../../api/cognitoUsersAdmin";
import styles from "./CognitoUsersAdminPage.module.css";

type InviteForm = {
  email: string;
  phone_number: string;
  name: string;
};

type EditForm = {
  email: string;
  phone_number: string;
  name: string;
  email_verified: boolean;
  phone_number_verified: boolean;
};

function emptyInviteForm(): InviteForm {
  return {
    email: "",
    phone_number: "",
    name: "",
  };
}

function emptyEditForm(): EditForm {
  return {
    email: "",
    phone_number: "",
    name: "",
    email_verified: false,
    phone_number_verified: false,
  };
}

function buildEditForm(user: AdminCognitoUserDetail): EditForm {
  return {
    email: user.email || "",
    phone_number: user.phone_number || "",
    name: user.name || "",
    email_verified: user.email_verified,
    phone_number_verified: user.phone_number_verified,
  };
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function badgeClass(status: string) {
  switch (status) {
    case "CONFIRMED":
      return styles.badgeGood;
    case "FORCE_CHANGE_PASSWORD":
    case "RESET_REQUIRED":
      return styles.badgeWarn;
    case "UNCONFIRMED":
      return styles.badgeMuted;
    default:
      return styles.badgeNeutral;
  }
}

export default function CognitoUsersAdminPage() {
  const [loading, setLoading] = useState(true);
  const [savingInvite, setSavingInvite] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [actingUsername, setActingUsername] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminCognitoUser[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [enabledFilter, setEnabledFilter] = useState<"" | "true" | "false">("");

  const [inviteForm, setInviteForm] = useState<InviteForm>(emptyInviteForm());

  const [editingUsername, setEditingUsername] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminCognitoUserDetail | null>(
    null,
  );
  const [editForm, setEditForm] = useState<EditForm>(emptyEditForm());

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchCognitoUsersAdmin({
        q: search || undefined,
        status: status || undefined,
        enabled: enabledFilter === "" ? undefined : enabledFilter === "true",
        limit: 60,
      });

      setUsers(res.users);
    } catch (err: any) {
      setError(err?.message || "Failed to load Cognito users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, status, enabledFilter]);

  const totals = useMemo(() => {
    return {
      total: users.length,
      enabled: users.filter((u) => u.enabled).length,
      disabled: users.filter((u) => !u.enabled).length,
      confirmed: users.filter((u) => u.user_status === "CONFIRMED").length,
    };
  }, [users]);

  async function openEdit(username: string) {
    try {
      setError(null);
      const res = await getCognitoUserAdmin(username);
      setEditingUsername(username);
      setEditingUser(res.user);
      setEditForm(buildEditForm(res.user));
    } catch (err: any) {
      setError(err?.message || "Failed to load user");
    }
  }

  function closeEdit() {
    setEditingUsername(null);
    setEditingUser(null);
    setEditForm(emptyEditForm());
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSavingInvite(true);
      setError(null);

      await inviteCognitoUserAdmin({
        email: inviteForm.email,
        phone_number: inviteForm.phone_number || null,
        name: inviteForm.name || null,
      });

      setInviteForm(emptyInviteForm());
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to invite user");
    } finally {
      setSavingInvite(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingUsername) return;

    try {
      setSavingEdit(true);
      setError(null);

      const res = await updateCognitoUserAdmin(editingUsername, {
        email: editForm.email || null,
        phone_number: editForm.phone_number || null,
        name: editForm.name || null,
        email_verified: editForm.email_verified,
        phone_number_verified: editForm.phone_number_verified,
      });

      setEditingUser(res.user);
      setEditForm(buildEditForm(res.user));
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save user");
    } finally {
      setSavingEdit(false);
    }
  }

  async function handleResetPassword(username: string) {
    try {
      setActingUsername(username);
      setError(null);
      await resetCognitoUserPasswordAdmin(username);
      await openEdit(username);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to reset password");
    } finally {
      setActingUsername(null);
    }
  }

  async function handleToggleEnabled(user: AdminCognitoUser) {
    try {
      setActingUsername(user.username);
      setError(null);

      if (user.enabled) {
        await disableCognitoUserAdmin(user.username);
      } else {
        await enableCognitoUserAdmin(user.username);
      }

      if (editingUsername === user.username) {
        await openEdit(user.username);
      }
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to update user access");
    } finally {
      setActingUsername(null);
    }
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Cognito User Administration</h1>
          <p className={styles.subtitle}>
            Invite users, update attributes, reset passwords, and control access
            for the live Cognito user pool.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}

      <div className={styles.statsGrid}>
        {[
          ["Users", totals.total],
          ["Enabled", totals.enabled],
          ["Disabled", totals.disabled],
          ["Confirmed", totals.confirmed],
        ].map(([label, value]) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statLabel}>{label}</div>
            <div className={styles.statValue}>{value}</div>
          </div>
        ))}
      </div>

      <section className="panel">
        <div className="panel-header">
          <h2>Invite User</h2>
        </div>

        <form onSubmit={handleInvite}>
          <div className="form-grid">
            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Email</label>
              <input
                className="input"
                type="email"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, email: e.target.value }))
                }
                placeholder="user@example.com"
                disabled={savingInvite}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Phone Number</label>
              <input
                className="input"
                value={inviteForm.phone_number}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    phone_number: e.target.value,
                  }))
                }
                placeholder="+380668115148"
                disabled={savingInvite}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.fieldLabel}>Display Name</label>
              <input
                className="input"
                value={inviteForm.name}
                onChange={(e) =>
                  setInviteForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Michael Tulskikh"
                disabled={savingInvite}
              />
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="submit"
              className="app-button"
              disabled={savingInvite}
            >
              {savingInvite ? "Inviting..." : "Invite User"}
            </button>
          </div>
        </form>
      </section>

      <div className={styles.filters}>
        <div className="filter-group search">
          <label className={styles.fieldLabel}>Search</label>
          <input
            className="input"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={() => setSearch(searchDraft.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchDraft.trim());
            }}
            placeholder="Search username, email, phone, name..."
          />
        </div>

        <div className="filter-group">
          <label className={styles.fieldLabel}>Status</label>
          <select
            className="select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="UNCONFIRMED">UNCONFIRMED</option>
            <option value="FORCE_CHANGE_PASSWORD">FORCE_CHANGE_PASSWORD</option>
            <option value="RESET_REQUIRED">RESET_REQUIRED</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="COMPROMISED">COMPROMISED</option>
            <option value="UNKNOWN">UNKNOWN</option>
          </select>
        </div>

        <div className="filter-group">
          <label className={styles.fieldLabel}>Access</label>
          <select
            className="select"
            value={enabledFilter}
            onChange={(e) =>
              setEnabledFilter(e.target.value as "" | "true" | "false")
            }
          >
            <option value="">All</option>
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      {editingUser && (
        <section className="panel">
          <div className="panel-header">
            <h2>Edit User</h2>
          </div>

          <form className={styles.form} onSubmit={handleSaveEdit}>
            <div className="form-grid">
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Username</label>
                <input
                  className="input"
                  value={editingUser.username}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Sub</label>
                <input
                  className="input"
                  value={editingUser.sub || "—"}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Email</label>
                <input
                  className="input"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={savingEdit}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Phone Number</label>
                <input
                  className="input"
                  value={editForm.phone_number}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      phone_number: e.target.value,
                    }))
                  }
                  disabled={savingEdit}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Display Name</label>
                <input
                  className="input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={savingEdit}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Groups</label>
                <input
                  className="input"
                  value={
                    editingUser.groups.length
                      ? editingUser.groups.join(", ")
                      : "—"
                  }
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Created</label>
                <input
                  className="input"
                  value={formatDateTime(editingUser.created_at)}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Updated</label>
                <input
                  className="input"
                  value={formatDateTime(editingUser.updated_at)}
                  disabled
                />
              </div>

              <div className={styles.formGroup}>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={editForm.email_verified}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email_verified: e.target.checked,
                      }))
                    }
                    disabled={savingEdit}
                  />
                  <span>Email verified</span>
                </label>
              </div>

              <div className={styles.formGroup}>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={editForm.phone_number_verified}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phone_number_verified: e.target.checked,
                      }))
                    }
                    disabled={savingEdit}
                  />
                  <span>Phone verified</span>
                </label>
              </div>

              <div className={`${styles.formGroup} ${styles.span2}`}>
                <label className={styles.fieldLabel}>Attributes</label>
                <div className={styles.attributesBox}>
                  {editingUser.attributes.map((attr) => (
                    <div className={styles.attributeRow} key={attr.Name}>
                      <span className={styles.attributeName}>{attr.Name}</span>
                      <span className={styles.attributeValue}>
                        {attr.Value || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className="secondary-button"
                onClick={closeEdit}
              >
                Close
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={actingUsername === editingUser.username}
                onClick={() => handleResetPassword(editingUser.username)}
              >
                {actingUsername === editingUser.username
                  ? "Working..."
                  : "Reset Password"}
              </button>

              <button
                type="button"
                className="secondary-button"
                disabled={actingUsername === editingUser.username}
                onClick={() =>
                  handleToggleEnabled({
                    username: editingUser.username,
                    sub: editingUser.sub,
                    email: editingUser.email,
                    phone_number: editingUser.phone_number,
                    name: editingUser.name,
                    enabled: editingUser.enabled,
                    user_status: editingUser.user_status,
                    email_verified: editingUser.email_verified,
                    phone_number_verified: editingUser.phone_number_verified,
                    created_at: editingUser.created_at,
                    updated_at: editingUser.updated_at,
                    mfa_enabled: editingUser.mfa_enabled,
                    mfa_methods: editingUser.mfa_methods,
                    groups: editingUser.groups,
                  })
                }
              >
                {actingUsername === editingUser.username
                  ? "Working..."
                  : editingUser.enabled
                    ? "Disable Access"
                    : "Enable Access"}
              </button>

              <button
                type="submit"
                className="app-button"
                disabled={savingEdit}
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <h2 className={styles.panelTitle}>User Pool Users</h2>
        </div>

        {loading ? (
          <div className={styles.empty}>Loading users…</div>
        ) : users.length === 0 ? (
          <div className={styles.empty}>No users found.</div>
        ) : (
          <div className={styles.tablepage__wrapper}>
            <table className="meta-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Access</th>
                  <th>Verified</th>
                  <th>Groups</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.username}>
                    <td>
                      <div className={styles.primaryText}>
                        {user.name || "—"}
                      </div>
                      <div className={styles.secondaryText}>
                        {user.username}
                      </div>
                    </td>

                    <td>
                      <div className={styles.primaryText}>
                        {user.email || "—"}
                      </div>
                      <div className={styles.secondaryText}>
                        {user.phone_number || "—"}
                      </div>
                    </td>

                    <td>
                      <span
                        className={`${styles.badge} ${badgeClass(user.user_status)}`}
                      >
                        {user.user_status}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`${styles.badge} ${
                          user.enabled
                            ? styles.enabledBadge
                            : styles.disabledBadge
                        }`}
                      >
                        {user.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </td>

                    <td>
                      <div className={styles.verificationStack}>
                        <span
                          className={
                            user.email_verified
                              ? styles.verifiedYes
                              : styles.verifiedNo
                          }
                        >
                          Email: {user.email_verified ? "Yes" : "No"}
                        </span>
                        <span
                          className={
                            user.phone_number_verified
                              ? styles.verifiedYes
                              : styles.verifiedNo
                          }
                        >
                          Phone: {user.phone_number_verified ? "Yes" : "No"}
                        </span>
                      </div>
                    </td>

                    <td>{user.groups.length ? user.groups.join(", ") : "—"}</td>
                    <td>{formatDateTime(user.updated_at)}</td>

                    <td className="actions">
                      <div className={styles.rowActions}>
                        <button
                          className="secondary-button"
                          onClick={() => openEdit(user.username)}
                        >
                          Edit
                        </button>

                        <button
                          className="secondary-button"
                          disabled={actingUsername === user.username}
                          onClick={() => handleToggleEnabled(user)}
                        >
                          {user.enabled ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
