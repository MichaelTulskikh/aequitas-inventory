import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  fetchInventoryLot,
  fetchInventoryLocationsTree,
  relocateInventoryLot,
  adjustInventoryLot,
  type InventoryLotDetail,
  updateInventoryLotAttributes,
} from "../api/inventory";
import ImageUploadPanel from "./ImageUploadPanel";
import styles from "./InventoryLotDetailContent.module.css";

type Props = {
  lotId: string;
};

type LocationOption = {
  id: string;
  parent_location_id?: string | null;
  name: string;
  code?: string | null;
  type: string;
  is_active?: boolean;
  path: string[];
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function InventoryLotDetailContent({ lotId }: Props) {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [lot, setLot] = useState<InventoryLotDetail | null>(null);

  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);

  const [relocateOpen, setRelocateOpen] = useState(false);
  const [relocating, setRelocating] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [relocateReason, setRelocateReason] = useState("");

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [adjustDelta, setAdjustDelta] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const [editingAttributes, setEditingAttributes] = useState(false);
  const [savingAttributes, setSavingAttributes] = useState(false);
  const [attributeForm, setAttributeForm] = useState<Record<string, any>>({});

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchInventoryLot(lotId);
      setLot(res.lot);
    } catch (err: any) {
      setError(err?.message || "Failed to load lot");
    } finally {
      setLoading(false);
    }
  }

  async function loadLocations() {
    if (!isAdmin) return;

    try {
      setLoadingLocations(true);
      const res = await fetchInventoryLocationsTree();
      setLocationOptions(
        (res.locations || []).filter((loc) => loc.is_active !== false),
      );
    } catch (err: any) {
      setError(err?.message || "Failed to load locations");
    } finally {
      setLoadingLocations(false);
    }
  }

  useEffect(() => {
    load();
  }, [lotId]);

  useEffect(() => {
    if (isAdmin) {
      loadLocations();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!lot) return;
    setSelectedLocationId(lot.location_id || "");
  }, [lot]);

  useEffect(() => {
    if (!lot) return;
    setAttributeForm(lot.attributes || {});
  }, [lot]);

  const availableDestinationOptions = useMemo(() => {
    if (!lot) return [];
    return locationOptions.filter((loc) => loc.id !== lot.location_id);
  }, [locationOptions, lot]);

  function updateAttributeValue(key: string, value: any) {
    setAttributeForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSaveAttributes(e: React.FormEvent) {
    e.preventDefault();
    if (!lot) return;

    try {
      setSavingAttributes(true);
      setError(null);
      setSuccess(null);

      await updateInventoryLotAttributes(lot.inventory_lot_id, {
        attributes: attributeForm,
      });

      setSuccess("Attributes updated successfully.");
      setEditingAttributes(false);
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to update attributes");
    } finally {
      setSavingAttributes(false);
    }
  }

  async function handleRelocateSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!lot) return;

    setSuccess(null);
    setError(null);

    if (!selectedLocationId) {
      setError("Please select a destination location.");
      return;
    }

    if (selectedLocationId === lot.location_id) {
      setError("Please choose a different location.");
      return;
    }

    try {
      setRelocating(true);

      await relocateInventoryLot(lot.inventory_lot_id, {
        to_location_id: selectedLocationId,
        reason: relocateReason.trim() || `Relocated from lot detail page`,
        metadata: {
          source: "inventory_lot_detail",
        },
      });

      setSuccess("Lot relocated successfully.");
      setRelocateOpen(false);
      setRelocateReason("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to relocate lot");
    } finally {
      setRelocating(false);
    }
  }

  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!lot) return;

    setSuccess(null);
    setError(null);

    const parsedDelta = Number(adjustDelta);

    if (!Number.isFinite(parsedDelta) || parsedDelta === 0) {
      setError("Please enter a non-zero adjustment delta.");
      return;
    }

    if (!adjustReason.trim()) {
      setError("Reason is required.");
      return;
    }

    try {
      setAdjusting(true);

      await adjustInventoryLot(lot.inventory_lot_id, {
        delta: parsedDelta,
        reason: adjustReason.trim(),
        metadata: {
          source: "inventory_lot_detail",
        },
      });

      setSuccess("Inventory adjusted successfully.");
      setAdjustOpen(false);
      setAdjustDelta("");
      setAdjustReason("");
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to adjust inventory");
    } finally {
      setAdjusting(false);
    }
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner" />
        <span>Loading lot…</span>
      </div>
    );
  }

  if (error && !lot) {
    return (
      <div className="table-section--error">
        Error: {error || "Lot not found"}
      </div>
    );
  }

  if (!lot) {
    return <div className="table-section--error">Error: Lot not found</div>;
  }

  return (
    <div className={styles.page}>
      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.grid}>
        <section className="panel">
          <div className="panel-header">
            <h2>Item</h2>
          </div>

          <div className={styles.fields}>
            <div>
              <strong>Name</strong>
              <div>{lot.item_name}</div>
            </div>

            <div>
              <strong>Description</strong>
              <div>{lot.item_description || "—"}</div>
            </div>

            <div>
              <strong>Default Unit</strong>
              <div>{lot.default_unit}</div>
            </div>

            <div>
              <strong>Status</strong>
              <div>{lot.status}</div>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className={`panel-header ${styles.headerWithActions}`}>
            <h2>Location</h2>

            {isAdmin && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setRelocateOpen((v) => !v);
                  setError(null);
                  setSuccess(null);
                }}
              >
                {relocateOpen ? "Cancel" : "Relocate Lot"}
              </button>
            )}
          </div>

          <div className={styles.fields}>
            <div>
              <strong>Location</strong>
              <div>{lot.location_name}</div>
            </div>

            <div>
              <strong>Path</strong>
              <div>{lot.location_path?.join(" / ") || "—"}</div>
            </div>

            <div>
              <strong>Received At</strong>
              <div>{formatDate(lot.received_at)}</div>
            </div>

            {lot.inbound_shipment_id && (
              <>
                <div>
                  <strong>Inbound Shipment</strong>
                  <div>
                    {lot.inbound_shipment_number || lot.inbound_shipment_id}
                  </div>
                </div>

                <div>
                  <strong>Source Reference</strong>
                  <div>{lot.inbound_shipment_reference || "—"}</div>
                </div>
              </>
            )}
          </div>

          {isAdmin && relocateOpen && (
            <form className={styles.form} onSubmit={handleRelocateSubmit}>
              <div className="form-group">
                <label>New Location</label>
                <select
                  value={selectedLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                  disabled={relocating || loadingLocations}
                >
                  <option value="">Select location</option>
                  {availableDestinationOptions.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.path.join(" / ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  value={relocateReason}
                  onChange={(e) => setRelocateReason(e.target.value)}
                  placeholder="Why is this lot being moved?"
                  disabled={relocating}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setRelocateOpen(false);
                    setRelocateReason("");
                    setSelectedLocationId(lot.location_id || "");
                    setError(null);
                  }}
                  disabled={relocating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="app-button"
                  disabled={relocating}
                >
                  {relocating ? "Relocating..." : "Confirm Relocation"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="panel">
          <div className={`panel-header ${styles.headerWithActions}`}>
            <h2>Quantities</h2>

            {isPrivileged && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setAdjustOpen((v) => !v);
                  setError(null);
                  setSuccess(null);
                }}
              >
                {adjustOpen ? "Cancel" : "Adjust Quantity"}
              </button>
            )}
          </div>

          <div className={styles.fields}>
            <div>
              <strong>Available</strong>
              <div>{lot.available_quantity}</div>
            </div>

            {isPrivileged && (
              <>
                <div>
                  <strong>On Hand</strong>
                  <div>{lot.quantity_on_hand ?? "—"}</div>
                </div>

                <div>
                  <strong>Reserved</strong>
                  <div>{lot.quantity_reserved ?? "—"}</div>
                </div>
              </>
            )}
          </div>

          {isPrivileged && adjustOpen && (
            <form className={styles.form} onSubmit={handleAdjustSubmit}>
              <div className="form-group">
                <label>Delta</label>
                <div className="muted">
                  Negative values remove inventory. Positive values add/correct
                  inventory.
                </div>
                <input
                  type="number"
                  step="0.001"
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(e.target.value)}
                  placeholder="Use negative for removal, positive for correction"
                  disabled={adjusting}
                />
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Why is this quantity being adjusted?"
                  disabled={adjusting}
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setAdjustOpen(false);
                    setAdjustDelta("");
                    setAdjustReason("");
                    setError(null);
                  }}
                  disabled={adjusting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="app-button"
                  disabled={adjusting}
                >
                  {adjusting ? "Saving..." : "Apply Adjustment"}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="panel">
          <div className={`panel-header ${styles.headerWithActions}`}>
            <h2>Attributes</h2>

            {isPrivileged && (
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setEditingAttributes((v) => !v);
                  setError(null);
                  setSuccess(null);
                }}
              >
                {editingAttributes ? "Cancel" : "Edit Attributes"}
              </button>
            )}
          </div>

          {!editingAttributes ? (
            Object.keys(lot.attributes || {}).length === 0 ? (
              <div className="table-section--empty">No lot attributes.</div>
            ) : (
              <div className={styles.attributeList}>
                {Object.entries(lot.attributes).map(([key, value]) => (
                  <span key={key} className="attribute-pill">
                    {formatLabel(key)}: {formatAttributeValue(value)}
                  </span>
                ))}
              </div>
            )
          ) : (
            <form className={styles.form} onSubmit={handleSaveAttributes}>
              {(lot.attribute_definitions || []).length === 0 ? (
                <div className="table-section--empty">
                  No attribute definitions for this item.
                </div>
              ) : (
                <div className="my-profile-grid">
                  {lot.attribute_definitions.map((attr: any) => {
                    const value = attributeForm[attr.attribute_key];

                    return (
                      <div key={attr.attribute_key} className="form-group">
                        <label>
                          {attr.label}
                          {attr.is_required ? " *" : ""}
                        </label>

                        {attr.data_type === "text" && (
                          <input
                            value={value ?? ""}
                            onChange={(e) =>
                              updateAttributeValue(
                                attr.attribute_key,
                                e.target.value,
                              )
                            }
                            disabled={savingAttributes}
                          />
                        )}

                        {attr.data_type === "number" && (
                          <input
                            type="number"
                            value={value ?? ""}
                            onChange={(e) =>
                              updateAttributeValue(
                                attr.attribute_key,
                                e.target.value,
                              )
                            }
                            disabled={savingAttributes}
                          />
                        )}

                        {attr.data_type === "date" && (
                          <input
                            type="date"
                            value={value ?? ""}
                            onChange={(e) =>
                              updateAttributeValue(
                                attr.attribute_key,
                                e.target.value,
                              )
                            }
                            disabled={savingAttributes}
                          />
                        )}

                        {attr.data_type === "boolean" && (
                          <label className="shipment-toggle">
                            <input
                              type="checkbox"
                              checked={!!value}
                              onChange={(e) =>
                                updateAttributeValue(
                                  attr.attribute_key,
                                  e.target.checked,
                                )
                              }
                              disabled={savingAttributes}
                            />
                            <span>Yes</span>
                          </label>
                        )}

                        {attr.data_type === "enum" && (
                          <select
                            value={value ?? ""}
                            onChange={(e) =>
                              updateAttributeValue(
                                attr.attribute_key,
                                e.target.value,
                              )
                            }
                            disabled={savingAttributes}
                          >
                            <option value="">Select...</option>
                            {(attr.allowed_values || []).map(
                              (option: string) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ),
                            )}
                          </select>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setEditingAttributes(false);
                    setAttributeForm(lot.attributes || {});
                  }}
                  disabled={savingAttributes}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="app-button"
                  disabled={savingAttributes}
                >
                  {savingAttributes ? "Saving..." : "Save Attributes"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>

      {isPrivileged && (
        <ImageUploadPanel
          mode="lot"
          entityId={lot.inventory_lot_id}
          title="Lot Images"
        />
      )}
    </div>
  );
}
