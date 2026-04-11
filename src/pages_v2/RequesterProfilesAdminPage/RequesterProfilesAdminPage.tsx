import { useEffect, useMemo, useState } from "react";
import {
  fetchRequesterProfilesAdmin,
  getRequesterProfileAdmin,
  updateRequesterProfileAdmin,
  type AdminRequesterProfile,
  type AdminRequesterProfileDetail,
} from "../../api/requesterProfilesAdmin";
import styles from "./RequesterProfilesAdminPage.module.css";

type ProfileForm = {
  full_name: string;
  signing_representative_name: string;
  edrpou: string;
  phone: string;
  email: string;
  official_address: string;
  delivery_address: string;
};

function emptyForm(): ProfileForm {
  return {
    full_name: "",
    signing_representative_name: "",
    edrpou: "",
    phone: "",
    email: "",
    official_address: "",
    delivery_address: "",
  };
}

function buildForm(profile: AdminRequesterProfileDetail): ProfileForm {
  return {
    full_name: profile.full_name || "",
    signing_representative_name: profile.signing_representative_name || "",
    edrpou: profile.edrpou || "",
    phone: profile.phone || "",
    email: profile.email || "",
    official_address: profile.official_address || "",
    delivery_address: profile.delivery_address || "",
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export default function RequesterProfilesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profiles, setProfiles] = useState<AdminRequesterProfile[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);

  const [editingProfileId, setEditingProfileId] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] =
    useState<AdminRequesterProfileDetail | null>(null);
  const [form, setForm] = useState<ProfileForm>(emptyForm());

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchRequesterProfilesAdmin({
        q: search || undefined,
        only_incomplete: onlyIncomplete,
      });

      setProfiles(res.profiles);
    } catch (err: any) {
      setError(err?.message || "Failed to load requester profiles");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, onlyIncomplete]);

  const totals = useMemo(() => {
    return {
      total: profiles.length,
      complete: profiles.filter((p) => p.is_complete).length,
      incomplete: profiles.filter((p) => !p.is_complete).length,
    };
  }, [profiles]);

  async function openEdit(profileId: string) {
    try {
      setError(null);
      const res = await getRequesterProfileAdmin(profileId);
      setEditingProfileId(profileId);
      setEditingProfile(res.profile);
      setForm(buildForm(res.profile));
    } catch (err: any) {
      setError(err?.message || "Failed to load requester profile");
    }
  }

  function closeEdit() {
    setEditingProfileId(null);
    setEditingProfile(null);
    setForm(emptyForm());
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProfileId) return;

    try {
      setSaving(true);
      setError(null);

      await updateRequesterProfileAdmin(editingProfileId, {
        full_name: form.full_name || null,
        signing_representative_name: form.signing_representative_name || null,
        edrpou: form.edrpou || null,
        phone: form.phone || null,
        email: form.email || null,
        official_address: form.official_address || null,
        delivery_address: form.delivery_address || null,
      });

      closeEdit();
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save requester profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Requester Profiles</h1>
          <p className={styles.subtitle}>
            View and maintain requester identity data used for shipment creation
            and submission.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}

      <div className="dashboard-card-grid three">
        <div className="dashboard-card stat-card">
          <div className="stat-label">Profiles</div>
          <div className="stat-value">{totals.total}</div>
        </div>
        <div className="dashboard-card stat-card">
          <div className="stat-label">Complete</div>
          <div className="stat-value">{totals.complete}</div>
        </div>
        <div className="dashboard-card stat-card">
          <div className="stat-label">Incomplete</div>
          <div className="stat-value">{totals.incomplete}</div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className="filter-group search">
          <label>Search</label>
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={() => setSearch(searchDraft.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchDraft.trim());
            }}
            placeholder="Search requester, email, phone, EDRPOU..."
          />
        </div>

        <div className="filter-group small">
          <label>Filters</label>
          <label className="shipment-toggle">
            <input
              type="checkbox"
              checked={onlyIncomplete}
              onChange={(e) => setOnlyIncomplete(e.target.checked)}
            />
            <span>Only incomplete</span>
          </label>
        </div>
      </div>

      {editingProfile && (
        <section className="panel">
          <div className="panel-header">
            <h2>Edit Requester Profile</h2>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className="my-profile-grid">
              <div className="form-group">
                <label>Linked Account</label>
                <input
                  value={
                    editingProfile.account
                      ? `${editingProfile.account.full_name || "—"} (${editingProfile.account.email || "—"})`
                      : "—"
                  }
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Full Name</label>
                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Signing Representative Name</label>
                <input
                  value={form.signing_representative_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      signing_representative_name: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>EDRPOU</label>
                <input
                  value={form.edrpou}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, edrpou: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group span-2">
                <label>Official Address</label>
                <textarea
                  rows={3}
                  value={form.official_address}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      official_address: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group span-2">
                <label>Delivery Address</label>
                <textarea
                  rows={3}
                  value={form.delivery_address}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      delivery_address: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeEdit}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" className="app-button" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Profiles</h2>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            <span>Loading requester profiles…</span>
          </div>
        ) : profiles.length === 0 ? (
          <div className="dashboard-empty">No requester profiles found.</div>
        ) : (
          <table className="meta-table">
            <thead>
              <tr>
                <th>Requester</th>
                <th>Linked Account</th>
                <th>Contact</th>
                <th>Completeness</th>
                <th>Shipments</th>
                <th>Last Shipment</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>
                    <div>
                      <strong>{profile.full_name || "—"}</strong>
                      <div className="muted">{profile.edrpou || "—"}</div>
                    </div>
                  </td>

                  <td>
                    <div>
                      <div>{profile.account?.full_name || "—"}</div>
                      <div className="muted">
                        {profile.account?.email || "—"}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div>
                      <div>{profile.phone || "—"}</div>
                      <div className="muted">{profile.email || "—"}</div>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`${styles.completeness} ${
                        profile.is_complete
                          ? styles.complete
                          : styles.incomplete
                      }`}
                    >
                      {profile.is_complete ? "Complete" : "Incomplete"}
                    </span>
                  </td>

                  <td>{profile.shipment_count}</td>
                  <td>{formatDate(profile.last_shipment_at)}</td>

                  <td className="actions">
                    <button
                      className="secondary-button"
                      onClick={() => openEdit(profile.id)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
