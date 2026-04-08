import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {
  approveShipment,
  createShipmentLine,
  deleteShipmentLine,
  fulfillShipment,
  getShipment,
  reserveShipmentLine,
  submitShipment,
  unreserveShipmentLine,
  updateShipment,
  updateShipmentLine,
  type ShipmentDetail,
  type ShipmentLine,
} from "../api/shipments";
import {
  fetchInventoryCatalog,
  fetchInventoryItems,
} from "../api/inventory";
import "../styles_new/new-shipment.css"
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

type ReservableLot = {
  inventory_lot_id: string;
  location_name: string;
  location_path: string[];
  attributes: Record<string, unknown>;
  available_quantity: number;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function statusClass(status: string) {
  return `shipment-status status-${status}`;
}

function isEditableStatus(status: string) {
  return status === "draft";
}

function canAllocateStatus(status: string) {
  return status === "approved";
}

function LineForm({
  onSave,
  onCancel,
  items,
  loadingItems,
  initialItemId = "",
  initialQuantity = "",
  initialAttributes = "{}",
  initialNotes = "",
}: {
  onSave: (data: {
    item_id: string;
    requested_quantity: number;
    requested_attributes: Record<string, unknown>;
    notes: string;
  }) => Promise<void>;
  onCancel: () => void;
  items: InventoryItemOption[];
  loadingItems: boolean;
  initialItemId?: string;
  initialQuantity?: string | number;
  initialAttributes?: string;
  initialNotes?: string;
}) {
  const [itemId, setItemId] = useState(initialItemId);
  const [quantity, setQuantity] = useState(String(initialQuantity));
  const [attributesText, setAttributesText] = useState(initialAttributes);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let parsedAttributes: Record<string, unknown> = {};
    try {
      parsedAttributes = attributesText.trim()
        ? JSON.parse(attributesText)
        : {};
    } catch {
      setError("Requested attributes must be valid JSON.");
      return;
    }

    const qty = Number(quantity);
    if (!itemId || !Number.isFinite(qty) || qty <= 0) {
      setError("Item and positive quantity are required.");
      return;
    }

    try {
      setSaving(true);
      await onSave({
        item_id: itemId,
        requested_quantity: qty,
        requested_attributes: parsedAttributes,
        notes,
      });
    } catch (err: any) {
      setError(err?.message || "Failed to save line");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="shipment-line-form" onSubmit={handleSubmit}>
      <div className="shipment-line-form-grid">
        <div className="form-group">
          <label>Item</label>
          <select
            value={itemId}
            onChange={(e) => setItemId(e.target.value)}
            disabled={loadingItems || saving}
          >
            <option value="">Select item</option>
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
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Requested Attributes (JSON)</label>
        <textarea
          rows={4}
          value={attributesText}
          onChange={(e) => setAttributesText(e.target.value)}
          disabled={saving}
        />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={saving}
        />
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="app-button" disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function AllocationPanel({
  line,
  onReserve,
  onUnreserve,
}: {
  line: ShipmentLine;
  onReserve: (lotId: string, quantity: number) => Promise<void>;
  onUnreserve: (lotId: string, quantity: number) => Promise<void>;
}) {
  const [lots, setLots] = useState<ReservableLot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLotId, setSelectedLotId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(
    0,
    Number(line.requested_quantity) - Number(line.allocated_quantity || 0),
  );

  async function loadLots() {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchInventoryCatalog({
        page: 1,
        page_size: 50,
        only_available: true,
        q: line.item_name,
      });

      const matchingItem = data.items.find((i) => i.item_id === line.item_id);
      const nextLots: ReservableLot[] =
        matchingItem?.lots?.map((lot) => ({
          inventory_lot_id: lot.inventory_lot_id,
          location_name: lot.location_name,
          location_path: lot.location_path,
          attributes: lot.attributes,
          available_quantity: lot.available_quantity,
        })) || [];

      setLots(nextLots);
    } catch (err: any) {
      setError(err?.message || "Failed to load lots");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLots();
  }, [line.id]);

  async function handleReserve() {
    setError(null);
    const qty = Number(quantity);

    if (!selectedLotId || !Number.isFinite(qty) || qty <= 0) {
      setError("Select a lot and enter a positive quantity.");
      return;
    }

    await onReserve(selectedLotId, qty);
    setQuantity("");
    setSelectedLotId("");
    await loadLots();
  }

  async function handleUnreserve(allocationLotId: string, maxQty: number) {
    const qtyText = window.prompt(
      `Unreserve quantity (max ${maxQty})`,
      String(maxQty),
    );

    if (!qtyText) return;

    const qty = Number(qtyText);
    if (!Number.isFinite(qty) || qty <= 0 || qty > maxQty) return;

    await onUnreserve(allocationLotId, qty);
    await loadLots();
  }

  return (
    <div className="allocation-panel">
      <div className="allocation-summary">
        <span>Requested: {line.requested_quantity}</span>
        <span>Allocated: {line.allocated_quantity}</span>
        <span>Remaining: {remaining}</span>
      </div>

      <div className="allocation-existing">
        <h4>Current Allocations</h4>
        {line.allocations.length === 0 ? (
          <div className="muted">No allocations yet.</div>
        ) : (
          <table className="shipment-table nested">
            <thead>
              <tr>
                <th>Lot</th>
                <th>Quantity</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {line.allocations.map((allocation) => (
                <tr key={allocation.id}>
                  <td>{allocation.inventory_lot_id}</td>
                  <td>{allocation.quantity}</td>
                  <td className="actions">
                    <button
                      className="secondary-button"
                      onClick={() =>
                        handleUnreserve(
                          allocation.inventory_lot_id,
                          Number(allocation.quantity),
                        )
                      }
                    >
                      Unreserve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="allocation-new">
        <h4>Reserve from Available Lots</h4>

        {loading ? (
          <div className="muted">Loading lots…</div>
        ) : lots.length === 0 ? (
          <div className="muted">No available lots found for this item.</div>
        ) : (
          <>
            <div className="allocation-controls">
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
              >
                <option value="">Select lot</option>
                {lots.map((lot) => (
                  <option
                    key={lot.inventory_lot_id}
                    value={lot.inventory_lot_id}
                  >
                    {lot.location_name} · available {lot.available_quantity}
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="0"
                step="0.001"
                placeholder="Qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <button className="app-button" onClick={handleReserve}>
                Reserve
              </button>
            </div>

            <div className="allocation-lot-preview">
              {lots.map((lot) => (
                <div key={lot.inventory_lot_id} className="allocation-lot-card">
                  <div className="allocation-lot-head">
                    <strong>{lot.location_name}</strong>
                    <span>Available: {lot.available_quantity}</span>
                  </div>

                  <div className="allocation-lot-path">
                    {lot.location_path.join(" / ")}
                  </div>

                  <div className="allocation-lot-attrs">
                    {Object.entries(lot.attributes || {}).length === 0 ? (
                      <span className="muted">No attributes</span>
                    ) : (
                      Object.entries(lot.attributes).map(([key, value]) => (
                        <span key={key} className="attribute-pill">
                          {formatLabel(key)}: {formatValue(value)}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {error && <div className="form-error">{error}</div>}
      </div>
    </div>
  );
}

export default function ShipmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [shipment, setShipment] = useState<ShipmentDetail | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const [itemOptions, setItemOptions] = useState<InventoryItemOption[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  const [showAddLine, setShowAddLine] = useState(false);
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const editable = shipment ? isEditableStatus(shipment.status) : false;
  const canAllocate = shipment
    ? isPrivileged && canAllocateStatus(shipment.status)
    : false;
  const canSubmit = shipment ? shipment.status === "draft" : false;
  const canApprove = shipment
    ? isPrivileged && shipment.status === "submitted"
    : false;
  const canFulfill = shipment
    ? isPrivileged && shipment.status === "approved"
    : false;
  async function loadShipment() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const data = await getShipment(id);
      setShipment(data.shipment);
      setNotesDraft(data.shipment.notes || "");
    } catch (err: any) {
      setError(err?.message || "Failed to load shipment");
    } finally {
      setLoading(false);
    }
  }

  async function loadItems() {
    try {
      setLoadingItems(true);
      const data = await fetchInventoryItems();
      setItemOptions(data.items);
    } catch {
      setItemOptions([]);
    } finally {
      setLoadingItems(false);
    }
  }

  useEffect(() => {
    loadShipment();
    loadItems();
  }, [id]);

  const totals = useMemo(() => {
    if (!shipment) {
      return { requested: 0, allocated: 0, lines: 0 };
    }

    return shipment.lines.reduce(
      (acc, line) => {
        acc.requested += Number(line.requested_quantity || 0);
        acc.allocated += Number(line.allocated_quantity || 0);
        acc.lines += 1;
        return acc;
      },
      { requested: 0, allocated: 0, lines: 0 },
    );
  }, [shipment]);

  async function handleSaveNotes() {
    if (!shipment) return;
    await updateShipment(shipment.id, { notes: notesDraft });
    await loadShipment();
  }

  async function handleAddLine(data: {
    item_id: string;
    requested_quantity: number;
    requested_attributes: Record<string, unknown>;
    notes: string;
  }) {
    if (!shipment) return;
    await createShipmentLine(shipment.id, data);
    setShowAddLine(false);
    await loadShipment();
  }

  async function handleUpdateLine(
    lineId: string,
    data: {
      requested_quantity: number;
      requested_attributes: Record<string, unknown>;
      notes: string;
    },
  ) {
    await updateShipmentLine(lineId, data);
    setEditingLineId(null);
    await loadShipment();
  }

  async function handleDeleteLine(lineId: string) {
    const ok = window.confirm("Delete this shipment line?");
    if (!ok) return;
    await deleteShipmentLine(lineId);
    await loadShipment();
  }

  async function handleSubmitShipment() {
    if (!shipment) return;
    await submitShipment(shipment.id);
    await loadShipment();
  }

  async function handleApproveShipment() {
    if (!shipment) return;
    await approveShipment(shipment.id);
    await loadShipment();
  }

  async function handleFulfillShipment() {
    if (!shipment) return;
    const ok = window.confirm("Mark this shipment as fulfilled?");
    if (!ok) return;
    await fulfillShipment(shipment.id, { reason: "Shipment fulfilled" });
    await loadShipment();
  }

  async function handleReserve(
    lineId: string,
    lotId: string,
    quantity: number,
  ) {
    await reserveShipmentLine(lineId, {
      inventory_lot_id: lotId,
      quantity,
      reason: "Reserved from shipment detail",
    });
    await loadShipment();
  }

  async function handleUnreserve(
    lineId: string,
    lotId: string,
    quantity: number,
  ) {
    await unreserveShipmentLine(lineId, {
      inventory_lot_id: lotId,
      quantity,
      reason: "Unreserved from shipment detail",
    });
    await loadShipment();
  }

  if (loading && !shipment) {
    return (
      <div className="shipment-detail-page">
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading shipment…</span>
        </div>
      </div>
    );
  }

  if (error && !shipment) {
    return (
      <div className="shipment-detail-page">
        <div className="dashboard-error">Error: {error}</div>
      </div>
    );
  }

  if (!shipment) return null;

  return (
    <div className="shipment-detail-page">
      <div className="shipment-detail-header">
        <div>
          <div className="shipment-detail-breadcrumb">
            <Link to="/shipments">Shipments</Link> / {shipment.shipment_number}
          </div>
          <h1 className="shipment-detail-title">{shipment.shipment_number}</h1>
          <div className="shipment-detail-meta">
            <span className={statusClass(shipment.status)}>
              {shipment.status}
            </span>
            <span>Created {formatDate(shipment.created_at)}</span>
            <span>Submitted {formatDate(shipment.submitted_at)}</span>
            <span>Approved {formatDate(shipment.approved_at)}</span>
            <span>Fulfilled {formatDate(shipment.fulfilled_at)}</span>
          </div>
        </div>

        <div className="shipment-detail-actions">
          {canSubmit && (
            <button className="app-button" onClick={handleSubmitShipment}>
              Submit
            </button>
          )}

          {canApprove && (
            <button className="app-button" onClick={handleApproveShipment}>
              Approve
            </button>
          )}

          {canFulfill && (
            <button className="app-button" onClick={handleFulfillShipment}>
              Fulfill
            </button>
          )}
        </div>
      </div>

      <div className="shipment-detail-grid">
        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Requester</h2>
          </div>

          <div className="shipment-requester-grid">
            <div>
              <strong>Name</strong>
              <div>{shipment.requester_profile.full_name || "—"}</div>
            </div>
            <div>
              <strong>Signing Representative</strong>
              <div>
                {shipment.requester_profile.signing_representative_name || "—"}
              </div>
            </div>
            <div>
              <strong>EDRPOU</strong>
              <div>{shipment.requester_profile.edrpou || "—"}</div>
            </div>
            <div>
              <strong>Phone</strong>
              <div>{shipment.requester_profile.phone || "—"}</div>
            </div>
            <div>
              <strong>Email</strong>
              <div>{shipment.requester_profile.email || "—"}</div>
            </div>
            <div>
              <strong>Official Address</strong>
              <div>{shipment.requester_profile.official_address || "—"}</div>
            </div>
            <div className="span-2">
              <strong>Delivery Address</strong>
              <div>{shipment.requester_profile.delivery_address || "—"}</div>
            </div>
          </div>
        </section>

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Summary</h2>
          </div>

          <div className="shipment-summary-grid">
            <div className="summary-stat">
              <div className="summary-stat-label">Lines</div>
              <div className="summary-stat-value">{totals.lines}</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-label">Requested</div>
              <div className="summary-stat-value">{totals.requested}</div>
            </div>
            <div className="summary-stat">
              <div className="summary-stat-label">Allocated</div>
              <div className="summary-stat-value">{totals.allocated}</div>
            </div>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              rows={4}
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              disabled={!editable}
            />
          </div>

          {editable && (
            <div className="form-actions">
              <button className="app-button" onClick={handleSaveNotes}>
                Save Notes
              </button>
            </div>
          )}
        </section>
      </div>

      <section className="shipment-panel">
        <div className="shipment-panel-header">
          <h2>Shipment Lines</h2>

          {/* {editable && (
            <button
              className="app-button"
              onClick={() => {
                setEditingLineId(null);
                setShowAddLine((prev) => !prev);
              }}
            >
              {showAddLine ? "Close" : "Add Line"}
            </button>
          )} */}
        </div>

        {showAddLine && (
          <LineForm
            onSave={handleAddLine}
            onCancel={() => setShowAddLine(false)}
            items={itemOptions}
            loadingItems={loadingItems}
          />
        )}

        {shipment.lines.length === 0 ? (
          <div className="dashboard-empty">No shipment lines yet.</div>
        ) : (
          <div className="shipment-lines-stack">
            {shipment.lines.map((line) => {
              const editing = editingLineId === line.id;

              return (
                <div key={line.id} className="shipment-line-card">
                  <div className="shipment-line-head">
                    <div>
                      <div className="shipment-line-title">
                        {line.item_name}
                      </div>
                      <div className="shipment-line-subtitle">
                        Requested: {line.requested_quantity} {line.default_unit}
                        {" · "}
                        Allocated: {line.allocated_quantity}
                      </div>
                    </div>

                    <div className="shipment-line-actions">
                      {editable && !editing && (
                        <>
                          <button
                            className="secondary-button"
                            onClick={() => setEditingLineId(line.id)}
                          >
                            Edit
                          </button>
                          <button
                            className="secondary-button danger"
                            onClick={() => handleDeleteLine(line.id)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {editing ? (
                    <LineForm
                      onSave={async (data) => {
                        await handleUpdateLine(line.id, {
                          requested_quantity: data.requested_quantity,
                          requested_attributes: data.requested_attributes,
                          notes: data.notes,
                        });
                      }}
                      onCancel={() => setEditingLineId(null)}
                      items={itemOptions}
                      loadingItems={loadingItems}
                      initialItemId={line.item_id}
                      initialQuantity={String(line.requested_quantity)}
                      initialAttributes={JSON.stringify(
                        line.requested_attributes || {},
                        null,
                        2,
                      )}
                      initialNotes={line.notes || ""}
                    />
                  ) : (
                    <>
                      <div className="shipment-line-body">
                        <div>
                          <strong>Attributes</strong>
                          <div className="attribute-list">
                            {Object.entries(line.requested_attributes || {})
                              .length === 0 ? (
                              <span className="muted">
                                No requested attributes
                              </span>
                            ) : (
                              Object.entries(
                                line.requested_attributes || {},
                              ).map(([key, value]) => (
                                <span key={key} className="attribute-pill">
                                  {formatLabel(key)}: {formatValue(value)}
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div>
                          <strong>Notes</strong>
                          <div>{line.notes || "—"}</div>
                        </div>
                      </div>

                      {canAllocate && (
                        <AllocationPanel
                          line={line}
                          onReserve={(lotId, quantity) =>
                            handleReserve(line.id, lotId, quantity)
                          }
                          onUnreserve={(lotId, quantity) =>
                            handleUnreserve(line.id, lotId, quantity)
                          }
                        />
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
