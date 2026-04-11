import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { createShipment, createShipmentLine } from "../../api/shipments";
import { fetchInventoryItems } from "../../api/inventory";
import { getMyRequesterProfile } from "../../api/requesterProfile";
import styles from "./NewShipmentPage.module.css";

type InventoryItemOption = {
  id: string;
  name: string;
  description?: string | null;
  default_unit: string;
  category?: {
    id: string;
    name: string;
    path: string[];
  } | null;
};

type RequesterProfile = {
  id: string;
  full_name: string | null;
  signing_representative_name: string | null;
  edrpou: string | null;
  phone: string | null;
  email: string | null;
  official_address: string | null;
  delivery_address: string | null;
};

function isProfileComplete(profile: RequesterProfile | null) {
  if (!profile) return false;

  return [
    profile.full_name,
    profile.signing_representative_name,
    profile.edrpou,
    profile.phone,
    profile.email,
    profile.official_address,
    profile.delivery_address,
  ].every((v) => !!String(v || "").trim());
}

export default function NewShipmentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const prefillItemId = searchParams.get("item_id") || "";
  const prefillLotId = searchParams.get("lot_id") || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<RequesterProfile | null>(null);
  const [items, setItems] = useState<InventoryItemOption[]>([]);

  const [notes, setNotes] = useState("");
  const [itemId, setItemId] = useState(prefillItemId);
  const [requestedQuantity, setRequestedQuantity] = useState("");
  const [requestedAttributesText, setRequestedAttributesText] = useState("{}");

  const complete = useMemo(() => isProfileComplete(profile), [profile]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [profileRes, itemsRes] = await Promise.all([
          getMyRequesterProfile(),
          fetchInventoryItems(),
        ]);

        if (cancelled) return;

        setProfile(profileRes.profile);
        setItems(itemsRes.items);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load page");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateShipment(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    setError(null);

    if (!complete) {
      setError("Complete your requester profile before creating a shipment.");
      return;
    }

    let parsedAttributes: Record<string, unknown> = {};
    try {
      parsedAttributes = requestedAttributesText.trim()
        ? JSON.parse(requestedAttributesText)
        : {};
    } catch {
      setError("Requested attributes must be valid JSON.");
      return;
    }

    const qty =
      requestedQuantity.trim() === "" ? null : Number(requestedQuantity);

    try {
      setSaving(true);

      const shipmentRes = await createShipment({
        requester_profile_id: profile.id,
        notes: notes || undefined,
      });

      const shipmentId = shipmentRes.shipment.id;

      if (itemId && qty && qty > 0) {
        await createShipmentLine(shipmentId, {
          item_id: itemId,
          requested_quantity: qty,
          requested_attributes: parsedAttributes,
          notes: prefillLotId
            ? `Created from inventory selection (${prefillLotId})`
            : undefined,
        });
      }

      navigate(`/shipments/${shipmentId}`);
    } catch (err: any) {
      setError(err?.message || "Failed to create shipment");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`page-shell ${styles.page}`}>
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading new shipment form…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/shipments">Shipments</Link> / New Shipment
          </div>
          <h1 className={styles.title}>New Shipment</h1>
          <p className={styles.subtitle}>
            Create a draft shipment and optionally add the first requested line.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}

      <div className={styles.layout}>
        <section className="panel">
          <div className="panel-header">
            <h2>Requester Profile</h2>
          </div>

          {!profile ? (
            <div className="dashboard-empty">
              No requester profile found for your account.
            </div>
          ) : (
            <>
              <div
                className={`${styles.completeness} ${
                  complete ? styles.complete : styles.incomplete
                }`}
              >
                {complete ? "Profile complete" : "Profile incomplete"}
              </div>

              <div className={styles.requesterGrid}>
                <div>
                  <strong>Name</strong>
                  <div>{profile.full_name || "—"}</div>
                </div>
                <div>
                  <strong>Signing Representative</strong>
                  <div>{profile.signing_representative_name || "—"}</div>
                </div>
                <div>
                  <strong>EDRPOU</strong>
                  <div>{profile.edrpou || "—"}</div>
                </div>
                <div>
                  <strong>Phone</strong>
                  <div>{profile.phone || "—"}</div>
                </div>
                <div>
                  <strong>Email</strong>
                  <div>{profile.email || "—"}</div>
                </div>
                <div>
                  <strong>Official Address</strong>
                  <div>{profile.official_address || "—"}</div>
                </div>
                <div className="span-2">
                  <strong>Delivery Address</strong>
                  <div>{profile.delivery_address || "—"}</div>
                </div>
              </div>

              {!complete && (
                <div className="form-help">
                  Finish your profile before creating a shipment. Go to{" "}
                  <Link to="/profile">My Profile</Link>.
                </div>
              )}
            </>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Create Draft</h2>
          </div>

          <form className={styles.form} onSubmit={handleCreateShipment}>
            <div className="form-group">
              <label>Shipment Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-help">
              You can create an empty draft shipment, or add the first line now.
            </div>

            <div className={styles.lineGrid}>
              <div className="form-group">
                <label>First Item (optional)</label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  disabled={saving}
                >
                  <option value="">No item yet</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.category?.path?.length
                        ? ` (${item.category.path.join(" / ")})`
                        : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group small">
                <label>Requested Quantity</label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={requestedQuantity}
                  onChange={(e) => setRequestedQuantity(e.target.value)}
                  disabled={saving || !itemId}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Requested Attributes (JSON, optional)</label>
              <textarea
                rows={4}
                value={requestedAttributesText}
                onChange={(e) => setRequestedAttributesText(e.target.value)}
                disabled={saving || !itemId}
              />
            </div>

            {prefillLotId && (
              <div className="form-help">
                Started from inventory lot: <code>{prefillLotId}</code>
              </div>
            )}

            <div className="form-actions">
              <Link className="secondary-button" to="/shipments">
                Cancel
              </Link>

              <button
                type="submit"
                className="app-button"
                disabled={saving || !profile || !complete}
              >
                {saving ? "Creating..." : "Create Shipment"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
