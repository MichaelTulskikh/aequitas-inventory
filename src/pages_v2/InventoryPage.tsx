// import { useEffect, useMemo, useState } from "react";
import { useEffect, useState, Fragment } from "react";
import { Link } from "react-router-dom";
import {
  fetchInventoryCatalog,
  fetchInventoryCategories,
  fetchInventoryTags,
  type InventoryCatalogItem,
  type InventoryCatalogLot,
  type InventoryCatalogResponse,
} from "../api/inventory";
import {
  fetchShipments,
  createShipmentLine,
  reserveShipmentLine,
  deleteShipmentLine,
  type ShipmentListItem,
} from "../api/shipments";
import { getMyRequesterProfile } from "../api/requesterProfile";
import { useAuth } from "../auth/AuthContext";
import "../styles_new/inventory.css";
import AppModal from "../components/AppModal";
import InventoryLotDetailContent from "../components/InventoryLotDetailContent";

/*
Expected API shape from GET /inventory/catalog

type InventoryCatalogResponse = {
  items: Array<{
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
    is_internal_only?: boolean; // admin/staff only if returned
    lots: Array<{
      inventory_lot_id: string;
      location_id: string;
      location_name: string;
      location_path: string[];
      attributes: Record<string, unknown>;
      available_quantity: number;
      on_hand_quantity?: number;     // admin/staff only
      reserved_quantity?: number;    // admin/staff only
      lot_image_url: string | null;
      item_image_url: string | null;
      received_at: string | null;
      status: string;
    }>;
  }>;
  page: number;
  page_size: number;
  total: number;
};

Expected API shape from GET /inventory/categories

type InventoryCategoryOption = {
  id: string;
  name: string;
  path: string[];
};

Expected API shape from GET /inventory/tags

type InventoryTagOption = {
  id: string;
  name: string;
  code: string | null;
};
*/

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

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

export default function InventoryPage() {
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes("Admin");
  const isStaff = user?.roles?.includes("Staff");
  const isPrivileged = isAdmin || isStaff;

  const [selectedLotId, setSelectedLotId] = useState<string | null>(null);
  const [lotModalOpen, setLotModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [response, setResponse] = useState<InventoryCatalogResponse | null>(
    null,
  );
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(
    {},
  );

  const [categoryOptions, setCategoryOptions] = useState<
    Array<{ id: string; name: string; path: string[] }>
  >([]);
  const [tagOptions, setTagOptions] = useState<
    Array<{ id: string; name: string; code: string | null }>
  >([]);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [includeInternal, setIncludeInternal] = useState(false);

  const [tagSearch, setTagSearch] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const items = response?.items ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const [requestPrereqLoading, setRequestPrereqLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [activeDraftShipment, setActiveDraftShipment] =
    useState<ShipmentListItem | null>(null);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestingLot, setRequestingLot] = useState<{
    lot_id: string;
    item_id: string;
    item_name: string;
    attributes: Record<string, unknown>;
    available_quantity: number;
    location_name: string;
  } | null>(null);

  const [requestQuantity, setRequestQuantity] = useState("1");
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  const [palletSearchDraft, setPalletSearchDraft] = useState("");
  const [boxSearchDraft, setBoxSearchDraft] = useState("");
  const [palletNumbers, setPalletNumbers] = useState<number[]>([]);
  const [boxNumbers, setBoxNumbers] = useState<number[]>([]);

  function openLotModal(lotId: string) {
    setSelectedLotId(lotId);
    setLotModalOpen(true);
  }

  function closeLotModal() {
    setLotModalOpen(false);
    setSelectedLotId(null);
  }

  async function loadInventory() {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchInventoryCatalog({
        q: search || undefined,
        category_id: selectedCategoryId || undefined,
        tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
        pallet_numbers: palletNumbers.length ? palletNumbers : undefined,
        box_numbers: boxNumbers.length ? boxNumbers : undefined,
        page,
        page_size: pageSize,
        only_available: showOnlyAvailable,
        include_internal: isPrivileged ? includeInternal : false,
      });

      setResponse(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadFilters() {
      try {
        const [categories, tags] = await Promise.all([
          fetchInventoryCategories(),
          fetchInventoryTags(),
        ]);

        if (!cancelled) {
          setCategoryOptions(categories.categories);
          setTagOptions(tags.tags);
        }
      } catch {
        if (!cancelled) {
          setCategoryOptions([]);
          setTagOptions([]);
        }
      }
    }

    loadFilters();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadInventory();
  }, [
    page,
    pageSize,
    search,
    selectedCategoryId,
    selectedTagIds,
    palletNumbers,
    boxNumbers,
    showOnlyAvailable,
    includeInternal,
  ]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!(e.target as HTMLElement).closest(".inventory-tag-selector")) {
        setTagDropdownOpen(false);
      }
    }

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadRequestPrerequisites() {
      try {
        setRequestPrereqLoading(true);

        const [profileRes, shipmentsRes] = await Promise.all([
          getMyRequesterProfile(),
          fetchShipments({
            mine_only: true,
            status: "draft",
            page: 1,
            page_size: 1,
          }),
        ]);

        if (cancelled) return;

        setProfileComplete(isProfileComplete(profileRes.profile));
        setActiveDraftShipment(shipmentsRes.shipments?.[0] || null);
      } catch {
        if (!cancelled) {
          setProfileComplete(false);
          setActiveDraftShipment(null);
        }
      } finally {
        if (!cancelled) {
          setRequestPrereqLoading(false);
        }
      }
    }

    loadRequestPrerequisites();

    return () => {
      cancelled = true;
    };
  }, []);

  const canRequestLots =
    !requestPrereqLoading && profileComplete && !!activeDraftShipment;

  const requestDisabledReason = requestPrereqLoading
    ? "Loading request status..."
    : !profileComplete
      ? "Complete your requester profile before requesting inventory."
      : !activeDraftShipment
        ? "Create a draft shipment before requesting inventory."
        : "";

  function openRequestModal(
    item: InventoryCatalogItem,
    lot: InventoryCatalogLot,
  ) {
    if (!canRequestLots) return;
    
    setRequestingLot({
      lot_id: lot.inventory_lot_id,
      item_id: item.item_id,
      item_name: item.item_name,
      attributes: lot.attributes || {},
      available_quantity: Number(lot.available_quantity),
      location_name: lot.location_name,
    });

    setRequestQuantity("1");
    setRequestError(null);
    setRequestSuccess(null);
    setRequestModalOpen(true);
  }

  function closeRequestModal() {
    if (requestSaving) return;

    setRequestModalOpen(false);
    setRequestingLot(null);
    setRequestQuantity("1");
    setRequestError(null);
    setRequestSuccess(null);
  }

  function parseNumberList(value: string): number[] {
    return Array.from(
      new Set(
        value
          .split(",")
          .map((part) => Number(part.trim()))
          .filter((n) => Number.isFinite(n) && n > 0),
      ),
    );
  }

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log(requestingLot);
    if (!requestingLot || !activeDraftShipment) return;

    const qty = Number(requestQuantity);

    if (!Number.isFinite(qty) || qty < 1) {
      setRequestError("Quantity must be at least 1.");
      return;
    }

    if (qty > requestingLot.available_quantity) {
      setRequestError(
        `Quantity cannot exceed available quantity (${requestingLot.available_quantity}).`,
      );
      return;
    }

    let createdLineId: string | null = null;

    try {
      setRequestSaving(true);
      setRequestError(null);
      setRequestSuccess(null);

      const createdLine = await createShipmentLine(activeDraftShipment.id, {
        item_id: requestingLot.item_id,
        requested_quantity: qty,
        requested_attributes: requestingLot.attributes,
        notes: `Requested from lot ${requestingLot.lot_id}`,
      });

      createdLineId = createdLine.line.id;

      await reserveShipmentLine(createdLine.line.id, {
        inventory_lot_id: requestingLot.lot_id,
        quantity: qty,
        reason: "Requested from inventory page",
        metadata: { source: "inventory_page_modal" },
      });

      setRequestSuccess(
        `Added to shipment ${activeDraftShipment.shipment_number}.`,
      );

      await loadInventory();

      setTimeout(() => {
        closeRequestModal();
      }, 800);
    } catch (err: any) {
      if (createdLineId) {
        try {
          await deleteShipmentLine(createdLineId);
        } catch {
          // best-effort rollback only
        }
      }

      setRequestError(err?.message || "Failed to request inventory");
    } finally {
      setRequestSaving(false);
    }
  }

  function toggleExpanded(itemId: string) {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }

  function clearFilters() {
    setSearchDraft("");
    setSearch("");
    setSelectedCategoryId("");
    setSelectedTagIds([]);
    setPalletSearchDraft("");
    setBoxSearchDraft("");
    setPalletNumbers([]);
    setBoxNumbers([]);
    setShowOnlyAvailable(true);
    setIncludeInternal(false);
    setPage(1);
  }

  function renderTags(item: InventoryCatalogItem) {
    if (!item.tags.length) return <span className="muted">—</span>;

    return (
      <div className="inventory-tag-list">
        {item.tags.map((tag) => (
          <span key={tag.id} className="inventory-tag-chip">
            {tag.name}
          </span>
        ))}
      </div>
    );
  }

  function renderLots(item: InventoryCatalogItem) {
    if (!item.lots.length) {
      return (
        <tr className="inventory-lot-row">
          <td colSpan={7}>
            <div className="inventory-empty-lots">No lots available.</div>
          </td>
        </tr>
      );
    }

    return item.lots.map((lot) => {
      return (
        <tr key={lot.inventory_lot_id} className="inventory-lot-row">
          <td />

          <td data-label="Item">
            <div className="inventory-lot-item-copy">
              <div className="inventory-lot-item-name">{item.item_name}</div>
              <div className="inventory-lot-location">{lot.location_name}</div>
              <div className="inventory-lot-path">
                {lot.location_path.join(" / ")}
              </div>
            </div>
          </td>

          <td data-label="Category">
            {item.category ? item.category.path.join(" / ") : "—"}
          </td>

          <td data-label="Tags / Lot Details">
            <div className="inventory-lot-details">
              {Object.keys(lot.attributes).length === 0 ? (
                <span className="muted">No attributes</span>
              ) : (
                Object.entries(lot.attributes).map(([key, value]) => (
                  <div key={key} className="inventory-attribute-pill">
                    <strong>{formatLabel(key)}:</strong>{" "}
                    {formatAttributeValue(value)}
                  </div>
                ))
              )}
            </div>
          </td>

          <td data-label="Available" className="numeric available">
            {lot.available_quantity}
          </td>

          <td data-label="Admin Info">
            {isPrivileged ? (
              <div className="inventory-admin-qty">
                <div>On hand: {lot.on_hand_quantity ?? "—"}</div>
                <div>Reserved: {lot.reserved_quantity ?? "—"}</div>
                <div>Status: {formatLabel(lot.status)}</div>
              </div>
            ) : (
              <div className="inventory-admin-qty">
                <div>Status: {formatLabel(lot.status)}</div>
              </div>
            )}
          </td>

          <td className="actions">
            <button
              type="button"
              className="view-button"
              onClick={() => openLotModal(lot.inventory_lot_id)}
            >
              View
            </button>

            <button
              type="button"
              className="add-button"
              onClick={() => openRequestModal(item, lot)}
              disabled={!canRequestLots}
              title={
                !canRequestLots
                  ? requestDisabledReason
                  : "Request from this lot"
              }
            >
              Request
            </button>
          </td>
        </tr>
      );
    });
  }

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        <div>
          <h1 className="inventory-title">Inventory</h1>
          <p className="inventory-subtitle">
            Browse requestable inventory by item and variant.
          </p>
        </div>

        {isPrivileged && (
          <Link className="app-button" to="/receiving">
            Receive Inventory
          </Link>
        )}
      </div>

      <div className="inventory-filters">
        <div className="filter-group search">
          <label>Search</label>
          <input
            placeholder="Search items..."
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchDraft.trim());
                setPage(1);
              }
            }}
            onBlur={() => {
              setSearch(searchDraft.trim());
              setPage(1);
            }}
          />
        </div>

        <div className="filter-group">
          <label>Pallets</label>
          <input
            placeholder="e.g. 2, 5"
            value={palletSearchDraft}
            onChange={(e) => setPalletSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPalletNumbers(parseNumberList(palletSearchDraft));
                setPage(1);
              }
            }}
            onBlur={() => {
              setPalletNumbers(parseNumberList(palletSearchDraft));
              setPage(1);
            }}
          />
          {/* <div className="form-help">Match pallet numbers like 2,5</div> */}
        </div>

        <div className="filter-group">
          <label>Boxes</label>
          <input
            placeholder="e.g. 6, 7, 35"
            value={boxSearchDraft}
            onChange={(e) => setBoxSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setBoxNumbers(parseNumberList(boxSearchDraft));
                setPage(1);
              }
            }}
            onBlur={() => {
              setBoxNumbers(parseNumberList(boxSearchDraft));
              setPage(1);
            }}
          />
          {/* <div className="form-help">Match box numbers like 6,7,35</div> */}
        </div>

        <div className="filter-group">
          <label>Category</label>
          <select
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categoryOptions.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.path.join(" / ")}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Tags</label>

          <div className="inventory-tag-selector">
            {/* Selected tags */}
            <div className="inventory-tag-selected">
              {selectedTagIds.map((id) => {
                const tag = tagOptions.find((t) => t.id === id);
                if (!tag) return null;

                return (
                  <span key={id} className="inventory-tag-chip removable">
                    {tag.name}
                    <button
                      onClick={() =>
                        setSelectedTagIds((prev) =>
                          prev.filter((t) => t !== id),
                        )
                      }
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>

            {/* Input */}
            <input
              placeholder="Add tag..."
              value={tagSearch}
              onChange={(e) => {
                setTagSearch(e.target.value);
                setTagDropdownOpen(true);
              }}
              onFocus={() => setTagDropdownOpen(true)}
            />

            {/* Dropdown */}
            {tagDropdownOpen && (
              <div className="inventory-tag-dropdown">
                {tagOptions
                  .filter(
                    (t) =>
                      t.name.toLowerCase().includes(tagSearch.toLowerCase()) &&
                      !selectedTagIds.includes(t.id),
                  )
                  .slice(0, 10)
                  .map((tag) => (
                    <div
                      key={tag.id}
                      className="inventory-tag-option"
                      onClick={() => {
                        setSelectedTagIds((prev) => [...prev, tag.id]);
                        setTagSearch("");
                        setPage(1);
                      }}
                    >
                      {tag.name}
                    </div>
                  ))}

                {tagOptions.length === 0 && (
                  <div className="inventory-tag-option muted">No tags</div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="filter-group visibility-inline">
          <label>Visibility</label>

          <div className="inventory-visibility-inline">
            <button
              className={`visibility-chip ${showOnlyAvailable ? "active" : ""}`}
              onClick={() => {
                setShowOnlyAvailable((v) => !v);
                setPage(1);
              }}
            >
              Available
            </button>

            {isPrivileged && (
              <button
                className={`visibility-chip ${includeInternal ? "active" : ""}`}
                onClick={() => {
                  setIncludeInternal((v) => !v);
                  setPage(1);
                }}
              >
                Internal
              </button>
            )}
          </div>
        </div>

        <div className="filter-group apply">
          <button className="apply-button secondary" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {error && <div className="inventory-error">Error: {error}</div>}

      <div className="inventory-summary-bar">
        <div>
          Showing <strong>{items.length}</strong> items
        </div>
        <div>
          Total results: <strong>{total}</strong>
        </div>
      </div>

      {!requestPrereqLoading && !profileComplete && (
        <div className="inventory-error">
          Complete your requester profile before requesting inventory.
        </div>
      )}

      {!requestPrereqLoading && profileComplete && !activeDraftShipment && (
        <div className="inventory-error">
          Create a draft shipment before requesting inventory.
        </div>
      )}

      <div className="inventory-table-wrapper">
        {loading && (
          <div className="table-loading">
            <div className="spinner" />
            <span>Loading inventory…</span>
          </div>
        )}

        <table className={`inventory-table ${loading ? "blurred" : ""}`}>
          <thead>
            <tr>
              <th />
              <th>Item</th>
              <th>Category</th>
              <th>Tags / Variant Summary</th>
              <th className="numeric">Available</th>
              <th>Admin Info</th>
              <th className="actions-col">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((item) => {
              const expanded = !!expandedItems[item.item_id];

              return (
                <Fragment key={item.item_id}>
                  <tr className="inventory-item-row">
                    <td className="expand-cell">
                      <button
                        className="expand-button"
                        onClick={() => toggleExpanded(item.item_id)}
                        aria-label={expanded ? "Collapse lots" : "Expand lots"}
                      >
                        {expanded ? "▾" : "▸"}
                      </button>
                    </td>

                    <td data-label="Item">
                      <div>
                        <div className="inventory-item-name">
                          {item.item_name}
                        </div>
                        {item.item_description && (
                          <div className="inventory-item-description">
                            {item.item_description}
                          </div>
                        )}
                      </div>
                    </td>

                    <td data-label="Category">
                      {item.category ? item.category.path.join(" / ") : "—"}
                    </td>

                    <td data-label="Tags / Variant Summary">
                      <div className="inventory-meta-cell">
                        {renderTags(item)}
                        <div className="inventory-lot-count">
                          {item.lot_count} lot{item.lot_count === 1 ? "" : "s"}{" "}
                          available
                        </div>
                      </div>
                    </td>

                    <td data-label="Available" className="numeric available">
                      {item.total_available_quantity}
                    </td>

                    <td data-label="Admin Info">
                      {isPrivileged ? (
                        <div className="inventory-admin-qty">
                          <div>Default unit: {item.default_unit}</div>
                          <div>
                            Internal only:{" "}
                            {item.is_internal_only ? "Yes" : "No"}
                          </div>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>

                    <td className="item-row-note">
                      <span className="muted">
                        {expanded ? "Lots shown below" : "Expand for lots"}
                      </span>
                    </td>
                  </tr>

                  {expanded && renderLots(item)}
                </Fragment>
              );
            })}

            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="inventory-empty-state">
                    No inventory matches the current filters.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <div className="pagination-group">
          <button
            className="page-btn"
            disabled={page === 1 || loading}
            onClick={() => setPage(1)}
          >
            First
          </button>

          <button
            className="page-btn"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
        </div>

        <span className="page-status">
          Page <strong>{page}</strong> of <strong>{totalPages}</strong>
        </span>

        <div className="pagination-group">
          <button
            className="page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>

          <button
            className="page-btn"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(totalPages)}
          >
            Last
          </button>
        </div>

        <div className="page-size-control">
          <label>Items Per Page</label>
          <select
            value={pageSize}
            disabled={loading}
            onChange={(e) => {
              setPage(1);
              setPageSize(Number(e.target.value));
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>

      {requestModalOpen && requestingLot && activeDraftShipment && (
        <div
          className="inventory-request-modal-backdrop"
          onClick={closeRequestModal}
        >
          <div
            className="inventory-request-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="inventory-request-modal-header">
              <h2>Request Inventory</h2>
            </div>

            {requestError && (
              <div className="inventory-error">Error: {requestError}</div>
            )}

            {requestSuccess && (
              <div className="profile-success">{requestSuccess}</div>
            )}

            <form onSubmit={handleRequestSubmit}>
              <div className="inventory-request-summary">
                <div>
                  <strong>Shipment:</strong>{" "}
                  {activeDraftShipment.shipment_number}
                </div>
                <div>
                  <strong>Item:</strong> {requestingLot.item_name}
                </div>
                <div>
                  <strong>Location:</strong> {requestingLot.location_name}
                </div>
                <div>
                  <strong>Available:</strong> {requestingLot.available_quantity}
                </div>
              </div>

              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min={1}
                  max={requestingLot.available_quantity}
                  step="1"
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(e.target.value)}
                  disabled={requestSaving}
                />
                <div className="form-help">
                  Enter a quantity from 1 to {requestingLot.available_quantity}.
                </div>
              </div>

              <div className="form-actions inventory-request-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeRequestModal}
                  disabled={requestSaving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="app-button"
                  disabled={requestSaving}
                >
                  {requestSaving ? "Adding..." : "Add to Shipment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lotModalOpen && selectedLotId && (
        <AppModal title="Inventory Lot" width="1000px" onClose={closeLotModal}>
          <InventoryLotDetailContent lotId={selectedLotId} />
        </AppModal>
      )}
    </div>
  );
}
