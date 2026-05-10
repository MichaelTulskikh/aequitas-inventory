import { useEffect, useState } from "react";
import {
  fetchSystemSettings,
  updateSystemSettings,
  type SystemSettingsResponse,
} from "../../api/systemSettings";
import styles from "./SystemSettingsPage.module.css";

export default function SystemSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [data, setData] = useState<SystemSettingsResponse | null>(null);

  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [expiringSoonDays, setExpiringSoonDays] = useState("90");
  const [defaultPageSize, setDefaultPageSize] = useState("25");

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchSystemSettings();
      setData(res);

      setLowStockThreshold(
        String(res.settings["inventory.low_stock_threshold"] ?? 5),
      );
      setExpiringSoonDays(
        String(res.settings["inventory.expiring_soon_days"] ?? 90),
      );
      setDefaultPageSize(String(res.settings["ui.default_page_size"] ?? 25));
    } catch (err: any) {
      setError(err?.message || "Failed to load system settings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const low = Number(lowStockThreshold);
    const exp = Number(expiringSoonDays);
    const page = Number(defaultPageSize);

    if (!Number.isFinite(low) || low < 0) {
      setError("Low stock threshold must be a non-negative number.");
      return;
    }

    if (!Number.isFinite(exp) || exp < 1) {
      setError("Expiring soon days must be at least 1.");
      return;
    }

    if (!Number.isFinite(page) || page < 1) {
      setError("Default page size must be at least 1.");
      return;
    }

    try {
      setSaving(true);

      const res = await updateSystemSettings({
        "inventory.low_stock_threshold": low,
        "inventory.expiring_soon_days": exp,
        "ui.default_page_size": page,
      });

      setData(res);
      setSuccess("Settings saved.");
    } catch (err: any) {
      setError(err?.message || "Failed to save system settings");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`page__wrapper ${styles.page}`}>
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading system settings…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>System Settings</h1>
          <p className={styles.subtitle}>
            Manage low-frequency operational configuration.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.grid}>
        <section className="panel">
          <div className="panel-header">
            <h2>Operational Thresholds</h2>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className="my-profile-grid">
              <div className="form-group">
                <label>Low Stock Threshold</label>
                <input
                  type="number"
                  min="0"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Expiring Soon Days</label>
                <input
                  type="number"
                  min="1"
                  value={expiringSoonDays}
                  onChange={(e) => setExpiringSoonDays(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Default Page Size</label>
                <input
                  type="number"
                  min="1"
                  value={defaultPageSize}
                  onChange={(e) => setDefaultPageSize(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="app-button" disabled={saving}>
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Environment</h2>
          </div>

          <div className={styles.readonlyList}>
            <div>
              <strong>Environment</strong>
              <div>{data?.environment.name || "—"}</div>
            </div>

            <div>
              <strong>Region</strong>
              <div>{data?.environment.region || "—"}</div>
            </div>

            <div>
              <strong>Build Version</strong>
              <div>{data?.environment.version || "—"}</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Available Roles</h2>
          </div>

          <div className="inventory-tag-list">
            {(data?.roles || []).map((role) => (
              <span key={role} className="inventory-tag-chip">
                {role}
              </span>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Raw Settings</h2>
          </div>

          <pre className={styles.json}>
            {JSON.stringify(data?.settings || {}, null, 2)}
          </pre>
        </section>
      </div>
    </div>
  );
}
