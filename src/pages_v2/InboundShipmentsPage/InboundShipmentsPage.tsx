import { useEffect, useMemo, useState } from "react";
import {
  createInboundShipment,
  fetchInboundShipments,
  updateInboundShipment,
  type InboundShipment,
} from "../../api/inboundShipments";
import styles from "./InboundShipmentsPage.module.css";

type ShipmentForm = {
  inbound_code: string;
  source_name: string;
  source_reference: string;
  notes: string;
  status: string;
};

const EMPTY_FORM: ShipmentForm = {
  inbound_code: "",
  source_name: "",
  source_reference: "",
  notes: "",
  status: "open",
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function InboundShipmentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [shipments, setShipments] = useState<InboundShipment[]>([]);
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ShipmentForm>(EMPTY_FORM);

  async function loadShipments() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchInboundShipments({
        q: search || undefined,
        status: statusFilter || undefined,
      });

      setShipments(res.shipments || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load inbound shipments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadShipments();
  }, [search, statusFilter]);

  const sortedShipments = useMemo(() => {
    return [...shipments].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });
  }, [shipments]);

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  function startCreate() {
    resetForm();
    setError(null);
    setSuccess(null);
  }

  function startEdit(shipment: InboundShipment) {
    setEditingId(shipment.id);
    setForm({
      inbound_code: shipment.inbound_code || "",
      source_name: shipment.source_name || "",
      source_reference: shipment.source_reference || "",
      notes: shipment.notes || "",
      status: shipment.status || "open",
    });
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.inbound_code.trim()) {
      setError("Inbound code is required");
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        await updateInboundShipment(editingId, {
          inbound_code: form.inbound_code.trim(),
          source_name: form.source_name.trim() || undefined,
          source_reference: form.source_reference.trim() || undefined,
          notes: form.notes.trim() || undefined,
          status: form.status,
        });

        setSuccess("Inbound shipment updated successfully.");
      } else {
        await createInboundShipment({
          inbound_code: form.inbound_code.trim(),
          source_name: form.source_name.trim() || undefined,
          source_reference: form.source_reference.trim() || undefined,
          notes: form.notes.trim() || undefined,
          status: form.status,
        });

        setSuccess("Inbound shipment created successfully.");
      }

      resetForm();
      await loadShipments();
    } catch (err: any) {
      setError(err?.message || "Failed to save inbound shipment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Inbound Shipments</h1>
        <p className={styles.subtitle}>
          Create and manage incoming shipment records used during inventory
          receiving.
        </p>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.layout}>
        <section className="panel">
          <div className="panel-header">
            <h2>{editingId ? "Edit Shipment" : "Create Shipment"}</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className={styles.formGroup}>
                <label className={styles.label}>Inbound Code *</label>
                <input
                  value={form.inbound_code}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      inbound_code: e.target.value,
                    }))
                  }
                  disabled={saving}
                  placeholder="e.g. UA-2026-001"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      status: e.target.value,
                    }))
                  }
                  disabled={saving}
                >
                  <option value="open">Open</option>
                  <option value="receiving">Receiving</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Source Name</label>
                <input
                  value={form.source_name}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      source_name: e.target.value,
                    }))
                  }
                  disabled={saving}
                  placeholder="Donor, partner, vendor, etc."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Source Reference</label>
                <input
                  value={form.source_reference}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      source_reference: e.target.value,
                    }))
                  }
                  disabled={saving}
                  placeholder="Manifest, transfer ref, document number..."
                />
              </div>

              <div className={cx(styles.formGroup, styles.span2)}>
                <label className={styles.label}>Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  disabled={saving}
                  placeholder="Optional notes about this inbound shipment"
                />
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={startCreate}
                  disabled={saving}
                >
                  Clear
                </button>

                <button type="submit" className="app-button" disabled={saving}>
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Create Shipment"}
                </button>
              </div>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2 className={styles.panelTitle}>Existing Shipments</h2>
          </div>

          <div className={styles.filters}>
            <div className="filter-group search">
              <label className={styles.label}>Search</label>
              <input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setSearch(searchDraft.trim());
                  }
                }}
                onBlur={() => setSearch(searchDraft.trim())}
                placeholder="Code, source, reference, notes..."
              />
            </div>

            <div className="filter-group">
              <label className={styles.label}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="open">Open</option>
                <option value="receiving">Receiving</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <div className="spinner" />
              <span>Loading inbound shipments…</span>
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className="meta-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Source</th>
                    <th>Reference</th>
                    <th>Status</th>
                    <th className="numeric">Lots</th>
                    <th className="numeric">Received Qty</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedShipments.map((shipment) => (
                    <tr key={shipment.id}>
                      <td>{shipment.inbound_code}</td>
                      <td>{shipment.source_name || "—"}</td>
                      <td>{shipment.source_reference || "—"}</td>
                      <td>
                        <span
                          className={`shipment-status status-${shipment.status.toLowerCase()}`}
                        >
                          {shipment.status}
                        </span>
                      </td>
                      <td className="numeric">{shipment.received_lot_count}</td>
                      <td className="numeric">{shipment.received_quantity}</td>
                      <td>{formatDate(shipment.created_at)}</td>
                      <td className="actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() => startEdit(shipment)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!loading && sortedShipments.length === 0 && (
                    <tr>
                      <td colSpan={8}>
                        <div className="dashboard-empty">
                          No inbound shipments found.
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
