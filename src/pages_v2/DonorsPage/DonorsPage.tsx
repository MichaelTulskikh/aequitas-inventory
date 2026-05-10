import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api/client";
import styles from "./DonorsPage.module.css";

type Donor = {
  id: string;
  display_name: string;
  legal_name: string | null;
  country_code: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type FetchDonorsResponse = {
  items: Donor[];
};

type CreateDonorPayload = {
  donor: {
    display_name: string;
    legal_name?: string | null;
    country_code?: string | null;
    contact_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  };
};

type UpdateDonorPayload = {
  donor: {
    display_name?: string;
    legal_name?: string | null;
    country_code?: string | null;
    contact_name?: string | null;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    notes?: string | null;
  };
};

async function fetchDonors(): Promise<FetchDonorsResponse> {
  return apiFetch("/v2/donors") as Promise<FetchDonorsResponse>;
}

async function createDonor(payload: CreateDonorPayload) {
  return apiFetch("/v2/donors", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateDonor(id: string, payload: UpdateDonorPayload) {
  return apiFetch(`/v2/donors/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// async function deleteDonor(id: string) {
//   return apiFetch(`/v2/donors/${id}`, {
//     method: "DELETE",
//   });
// }

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function emptyForm() {
  return {
    display_name: "",
    legal_name: "",
    country_code: "",
    contact_name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
  };
}

export default function DonorsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const donorsRes = await fetchDonors();

        if (cancelled) return;
        setDonors(donorsRes.items || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load donors page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDonors = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return donors;

    return donors.filter((item) =>
      [
        item.display_name,
        item.legal_name || "",
        item.country_code || "",
        item.contact_name || "",
        item.phone || "",
        item.email || "",
        item.address || "",
        item.notes || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [donors, search]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function startEdit(item: Donor) {
    setEditingId(item.id);
    setSuccess(null);
    setError(null);
    setForm({
      display_name: item.display_name,
      legal_name: item.legal_name || "",
      country_code: item.country_code || "",
      contact_name: item.contact_name || "",
      phone: item.phone || "",
      email: item.email || "",
      address: item.address || "",
      notes: item.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildPayload(): CreateDonorPayload | UpdateDonorPayload {
    const display_name = form.display_name.trim();
    const legal_name = form.legal_name.trim() ? form.legal_name.trim() : null;
    const country_code = form.country_code.trim()
      ? form.country_code.trim().toUpperCase()
      : null;
    const contact_name = form.contact_name.trim()
      ? form.contact_name.trim()
      : null;
    const phone = form.phone.trim() ? form.phone.trim() : null;
    const email = form.email.trim() ? form.email.trim() : null;
    const address = form.address.trim() ? form.address.trim() : null;
    const notes = form.notes.trim() ? form.notes.trim() : null;

    if (!display_name) {
      throw new Error("Display name is required.");
    }

    return {
      donor: {
        display_name,
        legal_name,
        country_code,
        contact_name,
        phone,
        email,
        address,
        notes,
      },
    };
  }

  async function reloadDonors() {
    const res = await fetchDonors();
    setDonors(res.items || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      const payload = buildPayload();

      if (editingId) {
        await updateDonor(editingId, payload as UpdateDonorPayload);
        setSuccess("Donor updated.");
      } else {
        await createDonor(payload as CreateDonorPayload);
        setSuccess("Donor created.");
      }

      await reloadDonors();
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Failed to save donor");
    } finally {
      setSaving(false);
    }
  }

  // async function handleDelete(id: string) {
  //   const confirmed = window.confirm(
  //     "Delete this donor? This cannot be undone."
  //   );
  //   if (!confirmed) return;

  //   try {
  //     setDeletingId(id);
  //     setError(null);
  //     setSuccess(null);

  //     await deleteDonor(id);
  //     await reloadDonors();

  //     if (editingId === id) {
  //       resetForm();
  //     }

  //     setSuccess("Donor deleted.");
  //   } catch (err: any) {
  //     setError(
  //       err?.message ||
  //         "Failed to delete donor. It may still be referenced by declarations."
  //     );
  //   } finally {
  //     setDeletingId(null);
  //   }
  // }

  if (loading) {
    return (
      <div className={`page__wrapper ${styles.page}`}>
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading donors…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/">Home</Link> / Donors
          </div>
          <h1 className={styles.title}>Donors</h1>
          <p className={styles.subtitle}>
            Create, update, and manage donor records.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.layout}>
        <section className="panel">
          <div className="panel-header">
            <h2>{editingId ? "Edit Donor" : "New Donor"}</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Display Name</label>
                <input
                  value={form.display_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      display_name: e.target.value,
                    }))
                  }
                  placeholder="e.g. Acme Foundation"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Legal Name</label>
                <input
                  value={form.legal_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      legal_name: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Country Code</label>
                <input
                  value={form.country_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      country_code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="e.g. US"
                  maxLength={10}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Contact Name</label>
                <input
                  value={form.contact_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      contact_name: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
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
                    setForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group span-2">
                <label>Address</label>
                <textarea
                  rows={3}
                  value={form.address}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group span-2">
                <label>Notes</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              {editingId ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel Edit
                </button>
              ) : (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Clear
                </button>
              )}

              <button type="submit" className="app-button" disabled={saving}>
                {saving
                  ? editingId
                    ? "Saving..."
                    : "Creating..."
                  : editingId
                    ? "Save Changes"
                    : "Create Donor"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Donor List</h2>
          </div>

          <div className={styles.toolbar}>
            <div className="filter-group search">
              <label>Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search donor, contact, email, address..."
              />
            </div>

            <div className={styles.summary}>
              {filteredDonors.length} / {donors.length} shown
            </div>
          </div>

          {filteredDonors.length === 0 ? (
            <div className="table-section--empty">No donors found.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className="shipments-table">
                <thead>
                  <tr>
                    <th>Display Name</th>
                    <th>Contact</th>
                    <th>Country</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.primaryCell}>
                          {item.display_name}
                        </div>
                        {item.legal_name ? (
                          <div className={styles.secondaryCell}>
                            {item.legal_name}
                          </div>
                        ) : null}
                        {item.notes ? (
                          <div className={styles.noteCell}>{item.notes}</div>
                        ) : null}
                      </td>
                      <td>{item.contact_name || "—"}</td>
                      <td>{item.country_code || "—"}</td>
                      <td>{item.email || "—"}</td>
                      <td>{item.phone || "—"}</td>
                      <td>{formatDateTime(item.updated_at)}</td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          {/* <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                          >
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button> */}
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
    </div>
  );
}
