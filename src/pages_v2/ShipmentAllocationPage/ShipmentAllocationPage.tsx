import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api/client";
import styles from "./ShipmentAllocationPage.module.css";

type ShipmentStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "fulfilled"
  | "cancelled";

type InventoryCatalogLot = {
  inventory_lot_id: string;
  location_id: string;
  location_name: string;
  location_path: string[];
  attributes: Record<string, unknown> | null;
  visibility_tier: number;
  available_quantity: number;
  on_hand_quantity?: number | null;
  reserved_quantity?: number | null;
  first_received_at?: string | null;
};

type InventoryCatalogItem = {
  item_id: string;
  item_name: string;
  item_description: string | null;
  default_unit: string;
  category: {
    id: string;
    name: string;
    path: string[];
  } | null;
  tags: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
  primary_image_url: string | null;
  total_available_quantity: number;
  lot_count: number;
  is_internal_only?: boolean;
  lots: InventoryCatalogLot[];
};

type InventoryCatalogResponse = {
  items: InventoryCatalogItem[];
  page: number;
  page_size: number;
  total: number;
};

type ShipmentAllocationSource = {
  id: string;
  shipment_line_allocation_id: string;
  inbound_shipment_line_id: string;
  quantity: number;
  inbound_shipment_id: string;
  inbound_shipment_number: string;
  declaration_id: string;
  declaration_number: string;
  declaration_is_undeclared: boolean;
  donor_id: string | null;
  donor_display_name: string | null;
  received_at: string;
};

type ShipmentLineAllocation = {
  id: string;
  shipment_line_id: string;
  inventory_lot_id: string;
  quantity: number;
  created_at: string;
  location_id: string;
  location_name: string;
  location_path: string[];
  visibility_tier: number;
  attributes: Record<string, unknown> | null;
  source_allocated_quantity: number;
  sources: ShipmentAllocationSource[];
};

type ShipmentLine = {
  id: string;
  shipment_id: string;
  item_id: string;
  requested_quantity: number;
  requested_attributes: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  item_name: string;
  default_unit: string;
  allocated_quantity: number;
  remaining_quantity: number;
  allocations: ShipmentLineAllocation[];
};

type ShipmentListItem = {
  id: string;
  shipment_number: string;
  status: ShipmentStatus;
  notes: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  fulfilled_at: string | null;
  requester_profile: {
    id: string;
    full_name: string | null;
    delivery_address: string | null;
  };
  created_by: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  line_count: number;
  total_requested_quantity: number;
  total_allocated_quantity: number;
};

type ShipmentDetail = {
  id: string;
  requester_profile_id: string;
  created_by_account_id: string;
  shipment_number: string;
  status: ShipmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  fulfilled_at: string | null;
  requester_profile: {
    id: string;
    account_id: string;
    full_name: string | null;
    signing_representative_name: string | null;
    edrpou: string | null;
    phone: string | null;
    email: string | null;
    official_address: string | null;
    delivery_address: string | null;
  };
  created_by: {
    id: string;
    full_name: string | null;
    email: string | null;
  };
  lines: ShipmentLine[];
};

type ListShipmentsResponse = {
  shipments: ShipmentListItem[];
  page: number;
  page_size: number;
  total: number;
};

type GetShipmentResponse = {
  shipment: ShipmentDetail;
};

// type ShipmentLineAllocationListResponse = {
//   allocations: ShipmentLineAllocation[];
// };

type CreateShipmentLineAllocationResponse = {
  allocation: ShipmentLineAllocation;
  inventory_txn_id: string;
};

type UpdateShipmentLineAllocationResponse = {
  allocation: ShipmentLineAllocation;
  inventory_txn_ids: string[];
};

type DeleteShipmentLineAllocationResponse = {
  ok: true;
  inventory_txn_id: string;
};

async function fetchShipments(params?: {
  q?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiFetch(`/v2/shipments${suffix}`) as Promise<ListShipmentsResponse>;
}

async function fetchShipment(id: string) {
  return apiFetch(`/v2/shipments/${id}`) as Promise<GetShipmentResponse>;
}

async function fetchInventoryCatalog(params?: {
  q?: string;
  only_available?: boolean;
  page?: number;
  page_size?: number;
}) {
  const search = new URLSearchParams();
  if (params?.q) search.set("q", params.q);
  if (params?.only_available !== undefined) {
    search.set("only_available", String(params.only_available));
  }
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiFetch(
    `/v2/inventory/catalog${suffix}`,
  ) as Promise<InventoryCatalogResponse>;
}

// async function fetchShipmentLineAllocations(shipmentLineId: string) {
//   return apiFetch(
//     `/v2/shipment-lines/${shipmentLineId}/allocations`,
//   ) as Promise<ShipmentLineAllocationListResponse>;
// }

async function createShipmentLineAllocation(
  shipmentLineId: string,
  payload: {
    inventory_lot_id: string;
    quantity: number;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  return apiFetch(`/v2/shipment-lines/${shipmentLineId}/allocations`, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<CreateShipmentLineAllocationResponse>;
}

async function updateShipmentLineAllocation(
  allocationId: string,
  payload: {
    quantity: number;
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  return apiFetch(`/v2/shipment-line-allocations/${allocationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<UpdateShipmentLineAllocationResponse>;
}

async function deleteShipmentLineAllocation(
  allocationId: string,
  payload?: {
    reason?: string | null;
    metadata?: Record<string, unknown> | null;
  },
) {
  return apiFetch(`/v2/shipment-line-allocations/${allocationId}`, {
    method: "DELETE",
    body: JSON.stringify(payload ?? {}),
  }) as Promise<DeleteShipmentLineAllocationResponse>;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

function formatPath(path?: string[]) {
  return path?.length ? path.join(" / ") : "—";
}

function prettyAttributes(value: Record<string, unknown> | null | undefined) {
  if (!value || Object.keys(value).length === 0) return "—";
  return Object.entries(value)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(", ");
}

function statusCanAllocate(status: ShipmentStatus) {
  return status === "draft" || status === "submitted" || status === "approved";
}

type AllocationModalProps = {
  open: boolean;
  line: ShipmentLine | null;
  shipmentStatus: ShipmentStatus | null;
  inventoryItems: InventoryCatalogItem[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function AllocationModal({
  open,
  line,
  shipmentStatus,
  inventoryItems,
  onClose,
  onSaved,
}: AllocationModalProps) {
  const [selectedLotId, setSelectedLotId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedLotId("");
    setQuantity("");
    setSaving(false);
    setError(null);
  }, [open, line?.id]);

  const matchingItem = useMemo(() => {
    if (!line) return null;
    return inventoryItems.find((item) => item.item_id === line.item_id) || null;
  }, [inventoryItems, line]);

  const candidateLots = useMemo(() => {
    if (!matchingItem) return [];
    return (matchingItem.lots || []).filter(
      (lot) => Number(lot.available_quantity) > 0,
    );
  }, [matchingItem]);

  const selectedLot = useMemo(() => {
    return (
      candidateLots.find((lot) => lot.inventory_lot_id === selectedLotId) ||
      null
    );
  }, [candidateLots, selectedLotId]);

  if (!open || !line) return null;

  const maxRemaining = Number(line.remaining_quantity || 0);
  const canAllocate = shipmentStatus
    ? statusCanAllocate(shipmentStatus)
    : false;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canAllocate) {
      setError("This shipment can no longer be allocated.");
      return;
    }

    if (!line) {
      setError("No line selected.");
      return;
    }

    const qty = Number(quantity);

    if (!selectedLotId) {
      setError("Select a lot.");
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    if (qty > maxRemaining) {
      setError(
        `Quantity cannot exceed remaining request quantity (${maxRemaining}).`,
      );
      return;
    }

    if (selectedLot && qty > Number(selectedLot.available_quantity)) {
      setError(
        `Quantity cannot exceed lot availability (${selectedLot.available_quantity}).`,
      );
      return;
    }

    try {
      setSaving(true);
      await createShipmentLineAllocation(line.id, {
        inventory_lot_id: selectedLotId,
        quantity: qty,
        reason: "Admin lot allocation",
      });
      await onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create allocation.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Allocate Shipment Line</h3>
            <div className={styles.modalSubtitle}>
              {line.item_name} • Remaining {line.remaining_quantity}{" "}
              {line.default_unit}
            </div>
          </div>

          <button type="button" className={styles.iconButton} onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="alert-error">Error: {error}</div>}

        <div className={styles.modalSummary}>
          <div>
            <strong>Requested Quantity:</strong> {line.requested_quantity}{" "}
            {line.default_unit}
          </div>
          <div>
            <strong>Allocated Quantity:</strong> {line.allocated_quantity}{" "}
            {line.default_unit}
          </div>
          <div>
            <strong>Remaining Quantity:</strong> {line.remaining_quantity}{" "}
            {line.default_unit}
          </div>
          <div>
            <strong>Requested Attributes:</strong>{" "}
            {prettyAttributes(line.requested_attributes)}
          </div>
        </div>

        {candidateLots.length === 0 ? (
          <div className={styles.emptyState}>
            No available inventory lots found for this item.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <div className="form-group">
              <label>Inventory Lot *</label>
              <select
                value={selectedLotId}
                onChange={(e) => setSelectedLotId(e.target.value)}
                disabled={saving}
              >
                <option value="">Select lot</option>
                {candidateLots.map((lot) => (
                  <option
                    key={lot.inventory_lot_id}
                    value={lot.inventory_lot_id}
                  >
                    {formatPath(lot.location_path)} • available{" "}
                    {lot.available_quantity} • tier {lot.visibility_tier}
                  </option>
                ))}
              </select>
            </div>

            {selectedLot && (
              <div className={styles.modalSummary}>
                <div>
                  <strong>Location:</strong>{" "}
                  {formatPath(selectedLot.location_path)}
                </div>
                <div>
                  <strong>Lot Attributes:</strong>{" "}
                  {prettyAttributes(selectedLot.attributes)}
                </div>
                <div>
                  <strong>Available:</strong> {selectedLot.available_quantity}{" "}
                  {line.default_unit}
                </div>
                <div>
                  <strong>First Received:</strong>{" "}
                  {formatDateTime(selectedLot.first_received_at)}
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Allocation Quantity *</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={saving}
                placeholder={`Max ${Math.min(
                  maxRemaining,
                  Number(selectedLot?.available_quantity ?? maxRemaining),
                )}`}
              />
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="app-button"
                disabled={saving || !canAllocate}
              >
                {saving ? "Allocating..." : "Create Allocation"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ShipmentAllocationPage() {
  const [loadingShipments, setLoadingShipments] = useState(true);
  const [loadingShipmentDetail, setLoadingShipmentDetail] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [shipmentSearch, setShipmentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("submitted");

  const [shipments, setShipments] = useState<ShipmentListItem[]>([]);
  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(
    null,
  );
  const [selectedShipment, setSelectedShipment] =
    useState<ShipmentDetail | null>(null);

  const [inventoryItems, setInventoryItems] = useState<InventoryCatalogItem[]>(
    [],
  );

  const [allocationModalOpen, setAllocationModalOpen] = useState(false);
  const [allocationLine, setAllocationLine] = useState<ShipmentLine | null>(
    null,
  );

  const [editingAllocationId, setEditingAllocationId] = useState<string | null>(
    null,
  );
  const [editingAllocationQty, setEditingAllocationQty] = useState("");
  const [savingAllocationId, setSavingAllocationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInventory() {
      try {
        setLoadingInventory(true);
        const res = await fetchInventoryCatalog({
          only_available: true,
          page: 1,
          page_size: 500,
        });
        if (cancelled) return;
        setInventoryItems(res.items || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load inventory.");
        }
      } finally {
        if (!cancelled) {
          setLoadingInventory(false);
        }
      }
    }

    loadInventory();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadShipments() {
      try {
        setLoadingShipments(true);
        setError(null);

        const res = await fetchShipments({
          q: shipmentSearch || undefined,
          status: statusFilter || undefined,
          page: 1,
          page_size: 100,
        });

        if (cancelled) return;
        setShipments(res.shipments || []);

        if (!selectedShipmentId && res.shipments?.length) {
          setSelectedShipmentId(res.shipments[0].id);
        }

        if (
          selectedShipmentId &&
          !res.shipments.some((shipment) => shipment.id === selectedShipmentId)
        ) {
          setSelectedShipmentId(res.shipments[0]?.id || null);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load shipments.");
        }
      } finally {
        if (!cancelled) {
          setLoadingShipments(false);
        }
      }
    }

    loadShipments();

    return () => {
      cancelled = true;
    };
  }, [shipmentSearch, statusFilter]);

  useEffect(() => {
    let cancelled = false;

    async function loadShipmentDetail() {
      if (!selectedShipmentId) {
        setSelectedShipment(null);
        return;
      }

      try {
        setLoadingShipmentDetail(true);
        const res = await fetchShipment(selectedShipmentId);
        if (cancelled) return;
        setSelectedShipment(res.shipment);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load shipment detail.");
          setSelectedShipment(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingShipmentDetail(false);
        }
      }
    }

    loadShipmentDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedShipmentId]);

  // const selectedShipmentListItem = useMemo(() => {
  //   return shipments.find((shipment) => shipment.id === selectedShipmentId) || null;
  // }, [shipments, selectedShipmentId]);

  async function refreshSelectedShipment() {
    if (!selectedShipmentId) return;
    const res = await fetchShipment(selectedShipmentId);
    setSelectedShipment(res.shipment);
  }

  function startAllocate(line: ShipmentLine) {
    setAllocationLine(line);
    setAllocationModalOpen(true);
  }

  function startEditAllocation(allocation: ShipmentLineAllocation) {
    setEditingAllocationId(allocation.id);
    setEditingAllocationQty(String(allocation.quantity));
  }

  async function handleSaveAllocationEdit(allocation: ShipmentLineAllocation) {
    const qty = Number(editingAllocationQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Allocation quantity must be a positive number.");
      return;
    }

    try {
      setSavingAllocationId(allocation.id);
      setError(null);
      await updateShipmentLineAllocation(allocation.id, {
        quantity: qty,
        reason: "Admin allocation update",
      });
      setSuccess("Allocation updated.");
      setEditingAllocationId(null);
      setEditingAllocationQty("");
      await refreshSelectedShipment();
    } catch (err: any) {
      setError(err?.message || "Failed to update allocation.");
    } finally {
      setSavingAllocationId(null);
    }
  }

  async function handleDeleteAllocation(allocation: ShipmentLineAllocation) {
    if (!window.confirm("Delete this allocation?")) return;

    try {
      setSavingAllocationId(allocation.id);
      setError(null);
      await deleteShipmentLineAllocation(allocation.id, {
        reason: "Admin allocation deletion",
      });
      setSuccess("Allocation deleted.");
      await refreshSelectedShipment();
    } catch (err: any) {
      setError(err?.message || "Failed to delete allocation.");
    } finally {
      setSavingAllocationId(null);
    }
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/">Home</Link> / Shipment Allocation
          </div>
          <h1 className={styles.title}>Shipment Allocation</h1>
          <p className={styles.subtitle}>
            Allocate outbound request lines from pooled inventory lots.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.layout}>
        <section className={`panel ${styles.sidebar}`}>
          <div className="panel-header">
            <h2>Shipments</h2>
          </div>

          <div className={styles.filters}>
            <div className="filter-group">
              <label>Search</label>
              <input
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                placeholder="Shipment number, requester..."
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="approved">Approved</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {loadingShipments ? (
            <div className="dashboard-loading">
              <div className="spinner" />
              <span>Loading shipments…</span>
            </div>
          ) : shipments.length === 0 ? (
            <div className="table-section--empty">No shipments found.</div>
          ) : (
            <div className={styles.shipmentList}>
              {shipments.map((shipment) => (
                <button
                  key={shipment.id}
                  type="button"
                  className={`${styles.shipmentListItem} ${
                    shipment.id === selectedShipmentId
                      ? styles.shipmentListItemActive
                      : ""
                  }`}
                  onClick={() => setSelectedShipmentId(shipment.id)}
                >
                  <div className={styles.shipmentListTop}>
                    <strong>{shipment.shipment_number}</strong>
                    <span className={styles.shipmentStatus}>
                      {shipment.status}
                    </span>
                  </div>
                  <div className={styles.shipmentListMeta}>
                    {shipment.requester_profile.full_name || "—"}
                  </div>
                  <div className={styles.shipmentListMeta}>
                    {shipment.line_count} lines • requested{" "}
                    {shipment.total_requested_quantity}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={`panel ${styles.main}`}>
          {!selectedShipmentId ? (
            <div className="table-section--empty">Select a shipment.</div>
          ) : loadingShipmentDetail ? (
            <div className="dashboard-loading">
              <div className="spinner" />
              <span>Loading shipment detail…</span>
            </div>
          ) : !selectedShipment ? (
            <div className="table-section--empty">Shipment not found.</div>
          ) : (
            <>
              <div className={styles.shipmentHeader}>
                <div>
                  <h2 className={styles.shipmentTitle}>
                    {selectedShipment.shipment_number}
                  </h2>
                  <div className={styles.shipmentMeta}>
                    <span>Status: {selectedShipment.status}</span>
                    <span>
                      Requester:{" "}
                      {selectedShipment.requester_profile.full_name || "—"}
                    </span>
                    <span>
                      Created: {formatDateTime(selectedShipment.created_at)}
                    </span>
                  </div>
                </div>

                <div className={styles.shipmentNotes}>
                  {selectedShipment.notes || "No shipment notes"}
                </div>
              </div>

              <div className={styles.shipmentDetailsGrid}>
                <div className={styles.infoCard}>
                  <strong>Requester</strong>
                  <div>
                    {selectedShipment.requester_profile.full_name || "—"}
                  </div>
                  <div>{selectedShipment.requester_profile.email || "—"}</div>
                  <div>{selectedShipment.requester_profile.phone || "—"}</div>
                </div>

                <div className={styles.infoCard}>
                  <strong>Delivery Address</strong>
                  <div>
                    {selectedShipment.requester_profile.delivery_address || "—"}
                  </div>
                </div>

                <div className={styles.infoCard}>
                  <strong>Status Timestamps</strong>
                  <div>
                    Submitted: {formatDateTime(selectedShipment.submitted_at)}
                  </div>
                  <div>
                    Approved: {formatDateTime(selectedShipment.approved_at)}
                  </div>
                  <div>
                    Fulfilled: {formatDateTime(selectedShipment.fulfilled_at)}
                  </div>
                </div>
              </div>

              {selectedShipment.lines.length === 0 ? (
                <div className="table-section--empty">
                  This shipment has no lines yet.
                </div>
              ) : (
                <div className={styles.linesSection}>
                  {selectedShipment.lines.map((line) => (
                    <div key={line.id} className={styles.lineCard}>
                      <div className={styles.lineHeader}>
                        <div>
                          <h3 className={styles.lineTitle}>{line.item_name}</h3>
                          <div className={styles.lineMeta}>
                            Requested {line.requested_quantity}{" "}
                            {line.default_unit} • Allocated{" "}
                            {line.allocated_quantity} • Remaining{" "}
                            {line.remaining_quantity}
                          </div>
                        </div>

                        <div className={styles.lineHeaderActions}>
                          <button
                            type="button"
                            className="app-button"
                            disabled={
                              !statusCanAllocate(selectedShipment.status) ||
                              Number(line.remaining_quantity) <= 0 ||
                              loadingInventory
                            }
                            onClick={() => startAllocate(line)}
                          >
                            Allocate
                          </button>
                        </div>
                      </div>

                      <div className={styles.lineDetails}>
                        <div>
                          <strong>Requested Attributes:</strong>{" "}
                          {prettyAttributes(line.requested_attributes)}
                        </div>
                        <div>
                          <strong>Notes:</strong> {line.notes || "—"}
                        </div>
                      </div>

                      {line.allocations.length === 0 ? (
                        <div className="table-section--empty">
                          No allocations yet.
                        </div>
                      ) : (
                        <div className={styles.tableWrap}>
                          <table className="shipments-table">
                            <thead>
                              <tr>
                                <th>Location</th>
                                <th>Allocated</th>
                                <th>Attributes</th>
                                <th>Tier</th>
                                <th>Source Split</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {line.allocations.map((allocation) => {
                                const isEditing =
                                  editingAllocationId === allocation.id;

                                return (
                                  <tr key={allocation.id}>
                                    <td>
                                      <div className={styles.primaryCell}>
                                        {allocation.location_name}
                                      </div>
                                      <div className={styles.secondaryCell}>
                                        {formatPath(allocation.location_path)}
                                      </div>
                                    </td>

                                    <td>
                                      {isEditing ? (
                                        <div className={styles.inlineEdit}>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.001"
                                            value={editingAllocationQty}
                                            onChange={(e) =>
                                              setEditingAllocationQty(
                                                e.target.value,
                                              )
                                            }
                                            disabled={
                                              savingAllocationId ===
                                              allocation.id
                                            }
                                          />
                                          <button
                                            type="button"
                                            className="app-button"
                                            onClick={() =>
                                              handleSaveAllocationEdit(
                                                allocation,
                                              )
                                            }
                                            disabled={
                                              savingAllocationId ===
                                              allocation.id
                                            }
                                          >
                                            Save
                                          </button>
                                          <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => {
                                              setEditingAllocationId(null);
                                              setEditingAllocationQty("");
                                            }}
                                            disabled={
                                              savingAllocationId ===
                                              allocation.id
                                            }
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <>
                                          {allocation.quantity}{" "}
                                          {line.default_unit}
                                        </>
                                      )}
                                    </td>

                                    <td>
                                      {prettyAttributes(allocation.attributes)}
                                    </td>
                                    <td>{allocation.visibility_tier}</td>

                                    <td>
                                      {allocation.source_allocated_quantity > 0
                                        ? `${allocation.source_allocated_quantity} / ${allocation.quantity}`
                                        : "Not split yet"}
                                    </td>

                                    <td>
                                      <div className="actions">
                                        {!isEditing && (
                                          <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() =>
                                              startEditAllocation(allocation)
                                            }
                                            disabled={
                                              !statusCanAllocate(
                                                selectedShipment.status,
                                              ) ||
                                              savingAllocationId ===
                                                allocation.id
                                            }
                                          >
                                            Edit
                                          </button>
                                        )}

                                        <button
                                          type="button"
                                          className="secondary-button"
                                          onClick={() =>
                                            handleDeleteAllocation(allocation)
                                          }
                                          disabled={
                                            !statusCanAllocate(
                                              selectedShipment.status,
                                            ) ||
                                            savingAllocationId === allocation.id
                                          }
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>

      <AllocationModal
        open={allocationModalOpen}
        line={allocationLine}
        shipmentStatus={selectedShipment?.status || null}
        inventoryItems={inventoryItems}
        onClose={() => setAllocationModalOpen(false)}
        onSaved={async () => {
          setSuccess("Allocation created.");
          await refreshSelectedShipment();
        }}
      />
    </div>
  );
}
