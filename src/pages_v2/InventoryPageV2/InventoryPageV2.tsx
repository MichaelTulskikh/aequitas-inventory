import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./InventoryPageV2.module.css";

/**
 * Replace these imports with your real api modules.
 * I left the function signatures here so the page is easy to wire.
 */
import { apiFetch } from "../../api/client";
import InventoryLotDetailContent from "../../components/InventoryLotDetailContent";

/* =========================
   Types
========================= */

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
  lot_image_url?: string | null;
  item_image_url?: string | null;
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

type ListShipmentsResponse = {
  shipments: ShipmentListItem[];
  page: number;
  page_size: number;
  total: number;
};

type CreateShipmentLineInput = {
  item_id: string;
  requested_quantity: number;
  requested_attributes?: Record<string, unknown> | null;
  notes?: string | null;
  auto_allocate_from_lot?: {
    inventory_lot_id: string;
    quantity: number;
    reason?: string | null;
  } | null;
};

type CreateShipmentLineResponse = {
  line: {
    id: string;
    shipment_id: string;
    item_id: string;
    requested_quantity: number;
    requested_attributes: Record<string, unknown> | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    status?: string;
  };
};

/* =========================
   API helpers
========================= */

async function fetchInventoryCatalog(params?: {
  q?: string;
  only_available?: boolean;
  include_internal?: boolean;
  page?: number;
  page_size?: number;
}): Promise<InventoryCatalogResponse> {
  const search = new URLSearchParams();

  if (params?.q) search.set("q", params.q);
  if (params?.only_available !== undefined) {
    search.set("only_available", String(params.only_available));
  }
  if (params?.include_internal !== undefined) {
    search.set("include_internal", String(params.include_internal));
  }
  if (params?.page) search.set("page", String(params.page));
  if (params?.page_size) search.set("page_size", String(params.page_size));

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiFetch(
    `/v2/inventory/catalog${suffix}`,
  ) as Promise<InventoryCatalogResponse>;
}

async function fetchMyValidOutboundShipments(): Promise<ShipmentListItem[]> {
  const res = (await apiFetch(
    `/v2/shipments?mine_only=true&page=1&page_size=100`,
  )) as ListShipmentsResponse;

  return (res.shipments || []).filter(
    (s) =>
      s.status === "draft" ||
      s.status === "submitted" ||
      s.status === "approved",
  );
}

async function createShipmentLine(
  shipmentId: string,
  payload: CreateShipmentLineInput,
): Promise<CreateShipmentLineResponse> {
  return apiFetch(`/v2/shipments/${shipmentId}/lines`, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<CreateShipmentLineResponse>;
}

/* =========================
   Utils
========================= */

function formatPath(path?: string[]) {
  return path?.length ? path.join(" / ") : "—";
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function prettyAttributes(value: Record<string, unknown> | null | undefined) {
  if (!value || Object.keys(value).length === 0) return "—";

  return Object.entries(value)
    .map(([key, v]) => `${key}: ${String(v)}`)
    .join(", ");
}

function isRequestableLot(lot: InventoryCatalogLot) {
  return Number(lot.available_quantity) > 0;
}

function getLotDisplayImage(lot: InventoryCatalogLot) {
  return lot.lot_image_url || lot.item_image_url || null;
}

function getLotImageSource(lot: InventoryCatalogLot): "lot" | "item" | "none" {
  if (lot.lot_image_url) return "lot";
  if (lot.item_image_url) return "item";
  return "none";
}

/* =========================
   Request Modal
========================= */

type RequestItemModalProps = {
  open: boolean;
  item: InventoryCatalogItem | null;
  lot: InventoryCatalogLot | null;
  shipments: ShipmentListItem[];
  loadingShipments: boolean;
  onClose: () => void;
  onCreated: (message: string) => void;
};

function RequestItemModal({
  open,
  item,
  lot,
  shipments,
  loadingShipments,
  onClose,
  onCreated,
}: RequestItemModalProps) {
  const [shipmentId, setShipmentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setShipmentId("");
    setQuantity("");
    setNotes("");
    setError(null);
    setSaving(false);
  }, [open, item?.item_id, lot?.inventory_lot_id]);

  const hasValidShipment = shipments.length > 0;
  const maxAvailable = Number(lot?.available_quantity ?? 0);

  if (!open || !item || !lot) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const currentItem = item;
    const currentLot = lot;

    if (!currentItem) {
      setError("No item selected.");
      return;
    }

    if (!currentLot) {
      setError("No lot selected");
      return;
    }

    const qty = Number(quantity);

    if (!shipmentId) {
      setError("Select an outbound shipment.");
      return;
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    if (qty > maxAvailable) {
      setError(
        `Requested quantity cannot exceed available inventory (${maxAvailable}).`,
      );
      return;
    }

    try {
      setSaving(true);

      await createShipmentLine(shipmentId, {
        item_id: currentItem.item_id,
        requested_quantity: qty,
        requested_attributes: currentLot.attributes ?? {},
        notes: notes.trim() || undefined,
        auto_allocate_from_lot: {
          inventory_lot_id: currentLot.inventory_lot_id,
          quantity: qty,
          reason: "Auto-allocated from requested lot",
        },
      });

      onCreated(
        "Item added to outbound shipment and allocated from the selected lot.",
      );
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to add item to shipment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>Request Item</h3>
            <div className={styles.modalSubtitle}>
              Add this item to one of your outbound shipments
            </div>
          </div>

          <button type="button" className={styles.iconButton} onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className="alert-error">Error: {error}</div>}

        <div className={styles.modalSummary}>
          <div>
            <strong>Item:</strong> {item.item_name}
          </div>
          <div>
            <strong>Available:</strong> {lot.available_quantity}{" "}
            {item.default_unit}
          </div>
          <div>
            <strong>Location:</strong> {formatPath(lot.location_path)}
          </div>
          <div>
            <strong>Attributes:</strong> {prettyAttributes(lot.attributes)}
          </div>
          <div>
            <strong>Visibility Tier:</strong> {lot.visibility_tier}
          </div>
        </div>

        {!loadingShipments && !hasValidShipment ? (
          <div className={styles.emptyState}>
            <p>You do not have a valid outbound shipment yet.</p>
            <p>Create a shipment first, then come back to request inventory.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            <div className="form-group">
              <label>Outbound Shipment *</label>
              <select
                value={shipmentId}
                onChange={(e) => setShipmentId(e.target.value)}
                disabled={saving || loadingShipments}
              >
                <option value="">
                  {loadingShipments
                    ? "Loading shipments..."
                    : "Select outbound shipment"}
                </option>
                {shipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.shipment_number} ({shipment.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="0"
                step="1"
                value={quantity}
                max={`${maxAvailable}`}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={saving}
                placeholder={`Max ${maxAvailable}`}
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={saving}
                placeholder="Optional request notes"
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
                disabled={saving || loadingShipments || !hasValidShipment}
              >
                {saving ? "Adding..." : "Add to Shipment"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* =========================
   Page
========================= */

export default function InventoryPageV2() {
  const [loading, setLoading] = useState(true);
  const [loadingShipments, setLoadingShipments] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<InventoryCatalogItem[]>([]);
  const [shipments, setShipments] = useState<ShipmentListItem[]>([]);

  const [search, setSearch] = useState("");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestItem, setRequestItem] = useState<InventoryCatalogItem | null>(
    null,
  );
  const [requestLot, setRequestLot] = useState<InventoryCatalogLot | null>(
    null,
  );

  const [viewLotId, setViewLotId] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  const [searchDraft, setSearchDraft] = useState("");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function toggleExpanded(itemId: string) {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId));
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetchInventoryCatalog({
          q: search || undefined,
          only_available: showOnlyAvailable,
          page,
          page_size: pageSize,
        });

        if (cancelled) return;

        setItems(res.items || []);
        setTotal(res.total || 0);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load inventory.");
        }
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
  }, [search, showOnlyAvailable, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, showOnlyAvailable, pageSize]);

  async function openRequestModal(
    item: InventoryCatalogItem,
    lot: InventoryCatalogLot,
  ) {
    setError(null);
    setSuccess(null);
    setRequestItem(item);
    setRequestLot(lot);
    setRequestModalOpen(true);

    try {
      setLoadingShipments(true);
      const nextShipments = await fetchMyValidOutboundShipments();
      setShipments(nextShipments);
    } catch (err: any) {
      setError(err?.message || "Failed to load outbound shipments.");
      setShipments([]);
    } finally {
      setLoadingShipments(false);
    }
  }

  const totalAvailable = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + Number(item.total_available_quantity || 0),
      0,
    );
  }, [items]);

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/">Home</Link> / Inventory
          </div>
          <h1 className={styles.title}>Inventory</h1>
          <p className={styles.subtitle}>
            Browse available inventory and add requested items to an outbound
            shipment.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link to="/shipments" className="secondary-button">
            My Outbound Shipments
          </Link>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <section className="panel">
        <div className={styles.toolbar}>
          <div className="filter-group search">
            <label>Search</label>
            <input
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              onBlur={() => {
                setPage(1);
                setSearch(searchDraft.trim());
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setPage(1);
                  setSearch(searchDraft.trim());
                }
              }}
              placeholder="Search item name, description, category..."
            />
          </div>

          <div className="filter-group">
            <label>Availability</label>
            <select
              value={showOnlyAvailable ? "available" : "all"}
              onChange={(e) => {
                setPage(1);
                setShowOnlyAvailable(e.target.value === "available");
              }}
            >
              <option value="available">Only available</option>
              <option value="all">Show all</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Page Size</label>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className={styles.summary}>
            {total} items • {totalAvailable} units on this page
          </div>
        </div>
      </section>

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading inventory…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="dashboard-empty">No inventory items found.</div>
      ) : (
        <>
          <div className={styles.itemGrid}>
            {items.map((item) => {
              const expanded = expandedItemId === item.item_id;

              return (
                <section key={item.item_id} className={styles.itemCard}>
                  <button
                    type="button"
                    className={styles.itemSummaryRow}
                    onClick={() => toggleExpanded(item.item_id)}
                  >
                    <div className={styles.itemHeaderLeft}>
                      {/* {item.primary_image_url ? (
                        <img
                          src={item.primary_image_url}
                          alt={item.item_name}
                          className={styles.itemThumbnail}
                        />
                      ) : (
                        <div className={styles.itemThumbnailPlaceholder}>
                          No image
                        </div>
                      )} */}

                      <div className={styles.itemHeaderMain}>
                        <div className={styles.itemName}>{item.item_name}</div>
                        {/* <div className={styles.itemMeta}>
                          {item.category?.path?.join(" / ") || "Uncategorized"}
                        </div> */}
                      </div>
                    </div>

                    <div className={styles.itemSummaryStats}>
                      <div>
                        <strong>{item.total_available_quantity}</strong>{" "}
                        {item.default_unit}
                      </div>
                      <div className={styles.itemMeta}>
                        {item.lot_count} lot(s)
                      </div>
                    </div>

                    <div className={styles.expandIcon}>
                      {expanded ? "▾" : "▸"}
                    </div>
                  </button>

                  {expanded && (
                    <div className={styles.itemExpandedBody}>
                      {item.item_description && (
                        <p className={styles.itemDescriptionCompact}>
                          {item.item_description}
                        </p>
                      )}

                      {item.tags?.length > 0 && (
                        <div className={styles.tagListCompact}>
                          {item.tags.map((tag) => (
                            <span key={tag.id} className={styles.tag}>
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className={styles.lotTableWrap}>
                        <table className="shipments-table">
                          <thead>
                            <tr>
                              <th>Location</th>
                              <th>Available</th>
                              <th>Attributes</th>
                              <th>Tier</th>
                              <th>Received</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.lots.map((lot) => (
                              <tr key={lot.inventory_lot_id}>
                                <td>
                                  <div className={styles.lotInfoCell}>
                                    {getLotDisplayImage(lot) ? (
                                      <img
                                        src={getLotDisplayImage(lot)!}
                                        alt={item.item_name}
                                        className={styles.lotThumbnail}
                                      />
                                    ) : (
                                      <div
                                        className={
                                          styles.lotThumbnailPlaceholder
                                        }
                                      >
                                        No image
                                      </div>
                                    )}

                                    <div>
                                      <div className={styles.primaryCell}>
                                        {lot.location_name}
                                      </div>
                                      <div className={styles.secondaryCell}>
                                        {formatPath(lot.location_path)}
                                      </div>
                                      {getLotImageSource(lot) === "item" && (
                                        <div className={styles.imageHint}>
                                          Using item default image
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td>
                                  {lot.available_quantity} {item.default_unit}
                                </td>

                                <td>
                                  <div className={styles.attributesCell}>
                                    {prettyAttributes(lot.attributes)}
                                  </div>
                                </td>

                                <td>{lot.visibility_tier}</td>
                                <td>{formatDateTime(lot.first_received_at)}</td>

                                <td>
                                  <div className={styles.rowActions}>
                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() =>
                                        setViewLotId(lot.inventory_lot_id)
                                      }
                                    >
                                      View
                                    </button>

                                    <button
                                      type="button"
                                      className="app-button"
                                      disabled={!isRequestableLot(lot)}
                                      onClick={() =>
                                        openRequestModal(item, lot)
                                      }
                                    >
                                      Request
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>
              );
            })}
          </div>

          <section className="panel" style={{marginTop: "10px"}}>
            <div className={styles.paginationBar}>
              <div className={styles.paginationSummary}>
                Page {page} of {totalPages} • {total} total item(s)
              </div>

              <div className={styles.paginationControls}>
                <button
                  type="button"
                  className="secondary-button"
                  disabled={page <= 1}
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                >
                  Previous
                </button>

                <span className={styles.pageIndicator}>{page}</span>

                <button
                  type="button"
                  className="secondary-button"
                  disabled={page >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      <RequestItemModal
        open={requestModalOpen}
        item={requestItem}
        lot={requestLot}
        shipments={shipments}
        loadingShipments={loadingShipments}
        onClose={() => setRequestModalOpen(false)}
        onCreated={(message) => setSuccess(message)}
      />

      {viewLotId && (
        <div className={styles.modalBackdrop}>
          <div className={styles.detailModal}>
            <div className={styles.modalHeader}>
              <div>
                <h3 className={styles.modalTitle}>Lot Details</h3>
                <div className={styles.modalSubtitle}>
                  View item, location, quantity, attributes, and images
                </div>
              </div>

              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setViewLotId(null)}
              >
                ×
              </button>
            </div>

            <div className={styles.detailModalBody}>
              <InventoryLotDetailContent lotId={viewLotId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
