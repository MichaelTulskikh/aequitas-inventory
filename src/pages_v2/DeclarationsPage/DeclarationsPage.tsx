import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api/client";
import styles from "./DeclarationsPage.module.css";

type DonorOption = {
  id: string;
  display_name: string;
  legal_name: string | null;
  country_code: string | null;
};

type Declaration = {
  id: string;
  declaration_number: string;
  donor_id: string | null;
  is_undeclared: boolean;
  country_code: string | null;
  declared_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  donor: {
    id: string;
    display_name: string;
    legal_name: string | null;
    country_code: string | null;
  } | null;
};

type FetchDeclarationsResponse = {
  items: Declaration[];
};

type FetchDonorsResponse = {
  items: DonorOption[];
};

type CreateDeclarationPayload = {
  declaration: {
    declaration_number: string;
    donor_id?: string | null;
    is_undeclared?: boolean;
    country_code?: string | null;
    declared_at?: string | null;
    notes?: string | null;
  };
};

type UpdateDeclarationPayload = {
  declaration: {
    declaration_number?: string;
    donor_id?: string | null;
    is_undeclared?: boolean;
    country_code?: string | null;
    declared_at?: string | null;
    notes?: string | null;
  };
};

async function fetchDeclarations(): Promise<FetchDeclarationsResponse> {
  return apiFetch("/v2/declarations") as Promise<FetchDeclarationsResponse>;
}

async function fetchDonors(): Promise<FetchDonorsResponse> {
  return apiFetch("/v2/donors") as Promise<FetchDonorsResponse>;
}

async function createDeclaration(payload: CreateDeclarationPayload) {
  return apiFetch("/v2/declarations", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

async function updateDeclaration(
  id: string,
  payload: UpdateDeclarationPayload,
) {
  return apiFetch(`/v2/declarations/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

// async function deleteDeclaration(id: string) {
//   return apiFetch(`/v2/declarations/${id}`, {
//     method: "DELETE",
//   });
// }

function toDatetimeLocalValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toApiDatetime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

function emptyForm() {
  return {
    declaration_number: "",
    donor_id: "",
    is_undeclared: false,
    country_code: "",
    declared_at: "",
    notes: "",
  };
}

export default function DeclarationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [donors, setDonors] = useState<DonorOption[]>([]);

  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [declarationsRes, donorsRes] = await Promise.all([
          fetchDeclarations(),
          fetchDonors(),
        ]);

        if (cancelled) return;

        setDeclarations(declarationsRes.items || []);
        setDonors(donorsRes.items || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load declarations page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDeclarations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return declarations;

    return declarations.filter((item) => {
      return [
        item.declaration_number,
        item.country_code || "",
        item.notes || "",
        item.donor?.display_name || "",
        item.donor?.legal_name || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [declarations, search]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
  }

  function startEdit(item: Declaration) {
    setEditingId(item.id);
    setSuccess(null);
    setError(null);
    setForm({
      declaration_number: item.declaration_number,
      donor_id: item.donor_id || "",
      is_undeclared: item.is_undeclared,
      country_code: item.country_code || "",
      declared_at: toDatetimeLocalValue(item.declared_at),
      notes: item.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildPayload(): CreateDeclarationPayload | UpdateDeclarationPayload {
    const declaration_number = form.declaration_number.trim();
    const donor_id = form.donor_id.trim() ? form.donor_id.trim() : null;
    const country_code = form.country_code.trim()
      ? form.country_code.trim()
      : null;
    const declared_at = form.declared_at.trim()
      ? toApiDatetime(form.declared_at)
      : null;
    const notes = form.notes.trim() ? form.notes.trim() : null;

    if (!declaration_number) {
      throw new Error("Declaration number is required.");
    }

    if (form.is_undeclared && !declaration_number.startsWith("UNDECLARED-")) {
      throw new Error(
        "Undeclared declarations must use a declaration number starting with UNDECLARED-",
      );
    }

    return {
      declaration: {
        declaration_number,
        donor_id,
        is_undeclared: form.is_undeclared,
        country_code,
        declared_at,
        notes,
      },
    };
  }

  async function reloadDeclarations() {
    const res = await fetchDeclarations();
    setDeclarations(res.items || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);
      const payload = buildPayload();

      if (editingId) {
        await updateDeclaration(editingId, payload as UpdateDeclarationPayload);
        setSuccess("Declaration updated.");
      } else {
        await createDeclaration(payload as CreateDeclarationPayload);
        setSuccess("Declaration created.");
      }

      await reloadDeclarations();
      resetForm();
    } catch (err: any) {
      setError(err?.message || "Failed to save declaration");
    } finally {
      setSaving(false);
    }
  }

  // async function handleDelete(id: string) {
  //   const confirmed = window.confirm(
  //     "Delete this declaration? This cannot be undone."
  //   );
  //   if (!confirmed) return;

  //   try {
  //     setDeletingId(id);
  //     setError(null);
  //     setSuccess(null);

  //     await deleteDeclaration(id);
  //     await reloadDeclarations();

  //     if (editingId === id) {
  //       resetForm();
  //     }

  //     setSuccess("Declaration deleted.");
  //   } catch (err: any) {
  //     setError(
  //       err?.message ||
  //         "Failed to delete declaration. It may still be referenced by another record."
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
          <span>Loading declarations…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/">Home</Link> / Declarations
          </div>
          <h1 className={styles.title}>Declarations</h1>
          <p className={styles.subtitle}>
            Create, update, and manage customs declarations.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.layout}>
        <section className="panel">
          <div className="panel-header">
            <h2>{editingId ? "Edit Declaration" : "New Declaration"}</h2>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Declaration Number</label>
                <input
                  value={form.declaration_number}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      declaration_number: e.target.value,
                    }))
                  }
                  placeholder="e.g. DEC-2026-001"
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Donor</label>
                <select
                  value={form.donor_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, donor_id: e.target.value }))
                  }
                  disabled={saving}
                >
                  <option value="">No donor selected</option>
                  {donors.map((donor) => (
                    <option key={donor.id} value={donor.id}>
                      {donor.display_name}
                      {donor.country_code ? ` (${donor.country_code})` : ""}
                    </option>
                  ))}
                </select>
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
                <label>Declared At</label>
                <input
                  type="datetime-local"
                  value={form.declared_at}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      declared_at: e.target.value,
                    }))
                  }
                  disabled={saving}
                />
              </div>

              <div className="form-group span-2">
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={form.is_undeclared}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        is_undeclared: e.target.checked,
                      }))
                    }
                    disabled={saving}
                  />
                  <span>Undeclared shipment</span>
                </label>
                <div className={styles.fieldHelp}>
                  When enabled, declaration number should start with{" "}
                  <code>UNDECLARED-</code>.
                </div>
              </div>

              <div className="form-group span-2">
                <label>Notes</label>
                <textarea
                  rows={5}
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
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
                    : "Create Declaration"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Declaration List</h2>
          </div>

          <div className={styles.toolbar}>
            <div className="filter-group search">
              <label>Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search number, donor, notes, country..."
              />
            </div>

            <div className={styles.summary}>
              {filteredDeclarations.length} / {declarations.length} shown
            </div>
          </div>

          {filteredDeclarations.length === 0 ? (
            <div className="table-section--empty">No declarations found.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className="shipments-table">
                <thead>
                  <tr>
                    <th>Number</th>
                    <th>Donor</th>
                    <th>Country</th>
                    <th>Declared At</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDeclarations.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <div className={styles.primaryCell}>
                          {item.declaration_number}
                        </div>
                        {item.notes ? (
                          <div className={styles.secondaryCell}>
                            {item.notes}
                          </div>
                        ) : null}
                      </td>
                      <td>{item.donor?.display_name || "—"}</td>
                      <td>{item.country_code || "—"}</td>
                      <td>{formatDateTime(item.declared_at)}</td>
                      <td>
                        <span
                          className={`shipment-status ${
                            item.is_undeclared
                              ? styles.statusUndeclared
                              : styles.statusDeclared
                          }`}
                        >
                          {item.is_undeclared ? "Undeclared" : "Declared"}
                        </span>
                      </td>
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
