import { useEffect, useRef, useState } from "react";
import { fetchInventory } from "../api/client";
import "../styles/inventory.css";
import "../styles/add-to-request-modal.css";
import { formatLabel, downloadCsv } from "../utils/formatting";
import ReceiveInventoryModal from "../components/ReceiveInventoryModal";
import { fetchItemTypes } from "../api/items";
import { fetchInventoryLotImages } from "../api/inventory";
import AddToRequestModal from "../components/AddToRequestModal";
import { getActiveRequest, addLineToActiveRequest } from "../api/requests";

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [draftSearch, setDraftSearch] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [draftCategories, setDraftCategories] = useState<string[]>([]);

  const [pallets, setPallets] = useState("");
  const [draftPallets, setDraftPallets] = useState("");

  const [boxes, setBoxes] = useState("");
  const [draftBoxes, setDraftBoxes] = useState("");

  const [minOnHand, setMinOnHand] = useState<number | "">("");
  const [draftMinOnHand, setDraftMinOnHand] = useState<number | "">("");

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [catOpen, setCatOpen] = useState(false);

  const [showReceiveModal, setShowReceiveModal] = useState(false);

  const [CATEGORY_OPTIONS, setCategoryOptions] = useState<string[]>([]);

  const [images, setImages] = useState<any[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [addLot, setAddLot] = useState<any | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchItemTypes().then((r) => {
      if (!cancelled) setCategoryOptions(r.item_types.map((t) => t.name));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    getActiveRequest()
      .then((r) => setActiveRequestId(r.request?.id || null))
      .catch(() => setActiveRequestId(null));
  }, []);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const load = (override?: Partial<{ categories: string[] }>) => {
    const activeCategories = override?.categories ?? categories;

    setLoading(true);
    setError(null);

    fetchInventory({
      q: search || undefined,
      types: activeCategories.length ? activeCategories.join(",") : undefined,
      pallets: pallets || undefined,
      boxes: boxes || undefined,
      min_on_hand: minOnHand === "" ? undefined : minOnHand,
      page,
      page_size: pageSize,
    })
      .then((data) => {
        setItems(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [page, pageSize, pallets, boxes, search, minOnHand]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openCategories = () => {
    setDraftCategories(categories);
    setCatOpen(true);
  };

  const categoryLabel =
    categories.length === 0
      ? "All categories"
      : `${categories.slice(0, 2).join(", ")}${
          categories.length > 2 ? ` +${categories.length - 2}` : ""
        }`;

  if (error) {
    return <div className="inventory-error">Error: {error}</div>;
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const Pagination = () => (
    <div className="pagination">
      <div className="pagination-group">
        <button
          className="page-btn"
          disabled={page === 1 || loading}
          onClick={() => {
            setPage(1);
          }}
          title="First page"
        >
          First
        </button>

        <button
          className="page-btn"
          disabled={page === 1 || loading}
          onClick={() => {
            setPage((p) => Math.max(1, p - 1));
          }}
          title="Previous page"
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
          onClick={() => {
            setPage((p) => p + 1);
          }}
          title="Next page"
        >
          Next
        </button>

        <button
          className="page-btn"
          disabled={page >= totalPages || loading}
          onClick={() => {
            setPage(totalPages);
          }}
          title="Last page"
        >
          Last
        </button>
      </div>

      {/* Items per page */}
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
          {[5, 10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <div className="inventory-page">
      <div className="inventory-header">
        {!activeRequestId && (
          <div className="inventory-banner">
            No open request. Go to Requests and click{" "}
            <strong>Create Request</strong>.
          </div>
        )}

        <h1 className="inventory-title">Inventory</h1>

        <button
          className="app-button"
          onClick={() => {
            setShowReceiveModal(true);
          }}
        >
          + Add Inventory
        </button>
      </div>

      {/* Filters */}
      <div className="inventory-filters">
        <div className="filter-group search">
          <label>Search</label>
          <input
            placeholder="Search item name..."
            value={draftSearch}
            onChange={(e) => setDraftSearch(e.target.value)}
            onBlur={() => {
              setSearch(draftSearch);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(draftSearch);
                setPage(1);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>

        {/* Category dropdown */}
        <div className="filter-group categories" ref={dropdownRef}>
          <label>Category</label>

          <div
            className="category-dropdown"
            onClick={() => (catOpen ? setCatOpen(false) : openCategories())}
          >
            <span>{categoryLabel}</span>
            <span className="chevron">▾</span>
          </div>

          {catOpen && (
            <div className="category-menu fixed">
              <div className="category-list">
                {CATEGORY_OPTIONS.map((cat) => (
                  <label key={cat} className="category-item">
                    <input
                      type="checkbox"
                      checked={draftCategories.includes(cat)}
                      onChange={() =>
                        setDraftCategories((prev) =>
                          prev.includes(cat)
                            ? prev.filter((c) => c !== cat)
                            : [...prev, cat],
                        )
                      }
                    />
                    <span>{cat}</span>
                  </label>
                ))}
              </div>

              <div className="category-actions">
                <button
                  className="clear"
                  onClick={() => setDraftCategories([])}
                >
                  Clear
                </button>
                <button
                  className="apply"
                  onClick={() => {
                    setCategories(draftCategories);
                    setCatOpen(false);
                    load({ categories: draftCategories });
                  }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="filter-group">
          <label>Pallets</label>
          <input
            placeholder="e.g. 11,7"
            value={draftPallets}
            onChange={(e) => setDraftPallets(e.target.value)}
            onBlur={() => {
              setPallets(draftPallets);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setPallets(draftPallets);
                setPage(1);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>

        <div className="filter-group">
          <label>Boxes</label>
          <input
            placeholder="e.g. 70,65"
            value={draftBoxes}
            onChange={(e) => setDraftBoxes(e.target.value)}
            onBlur={() => {
              setBoxes(draftBoxes);
              setPage(1);
              console.log("34343");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setBoxes(draftBoxes);
                setPage(1);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>

        <div className="filter-group small">
          <label>Min On Hand</label>
          <input
            type="number"
            min={0}
            placeholder="0"
            value={draftMinOnHand}
            onChange={(e) =>
              setDraftMinOnHand(
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
            onBlur={() => {
              setMinOnHand(draftMinOnHand);
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setMinOnHand(draftMinOnHand);
                setPage(1);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>

        <button
          className="apply-button"
          onClick={() => downloadCsv(items)}
          disabled={!items.length}
        >
          Download CSV
        </button>

        <div className="filter-group apply">
          <button
            className="apply-button"
            onClick={() => {
              setPage(1);
            }}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <Pagination />
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
              <th>Item</th>
              <th>Category</th>
              <th>Pallet</th>
              <th>Box</th>
              <th className="numeric">On Hand</th>
              <th className="numeric">Reserved</th>
              <th className="numeric">Available</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              let availabilityClass = "available";
              if (i.available === 0) availabilityClass += " zero";
              else if (i.available < 5) availabilityClass += " low";

              return (
                <tr key={i.lot_id}>
                  <td data-label="Item">{i.item_name}</td>
                  <td data-label="Category">{i.item_type}</td>
                  <td data-label="Pallet">{i.pallet_name}</td>
                  <td data-label="Box">{i.box_name}</td>
                  <td data-label="On Hand" className="numeric">
                    {i.on_hand}
                  </td>
                  <td data-label="Reserved" className="numeric">
                    {i.reserved}
                  </td>
                  <td
                    data-label="Available"
                    className={`numeric ${availabilityClass}`}
                  >
                    {i.available}
                  </td>
                  <td data-label="" className="actions">
                    <button
                      className="view-button"
                      onClick={async () => {
                        setSelectedItem(i);
                        setLoadingImages(true);
                        try {
                          const r = await fetchInventoryLotImages(i.lot_id);
                          setImages(r.images);
                        } finally {
                          setLoadingImages(false);
                        }
                      }}
                    >
                      View
                    </button>
                    <button
                      className="add-button"
                      disabled={!activeRequestId || i.available <= 0}
                      onClick={() => setAddLot(i)}
                      title={!activeRequestId ? "Create a request first" : ""}
                    >
                      Add
                    </button>
                    <AddToRequestModal
                      open={!!addLot}
                      onClose={() => setAddLot(null)}
                      itemName={addLot?.item_name || ""}
                      available={addLot?.available ?? 0}
                      onConfirm={async (qty) => {
                        await addLineToActiveRequest({
                          inventory_lot_id: addLot.lot_id,
                          quantity: qty,
                        });
                        // refresh inventory numbers + your available/reserved display
                        load();
                      }}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination />

      {/* Modal */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedItem.item_name}</h2>
              <button
                className="modal-close"
                onClick={() => setSelectedItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-meta">
              <div>{selectedItem.warehouse_name}</div>
              <div>
                {selectedItem.pallet_name} / {selectedItem.box_name}
              </div>
            </div>

            <div className="modal-section">
              <h3>Attributes</h3>
              <table className="attributes-table">
                <tbody>
                  {Object.entries(selectedItem.attributes || {}).map(
                    ([key, value]) =>
                      value ? (
                        <tr key={key}>
                          <td className="attr-key">{formatLabel(key)}</td>
                          <td className="attr-value">
                            {formatLabel(String(value))}
                          </td>
                        </tr>
                      ) : null,
                  )}
                </tbody>
              </table>
            </div>
            <div className="modal-section">
              <h3>Images</h3>

              {loadingImages ? (
                <div className="image-loading">Loading images…</div>
              ) : images.length === 0 ? (
                <div className="image-empty">No images available</div>
              ) : (
                <div className="image-grid">
                  {images.map((img) => (
                    <img
                      key={img.id}
                      src={img.url}
                      alt={img.caption || ""}
                      onClick={() => setActiveImage(img.url)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showReceiveModal && (
        <ReceiveInventoryModal
          onClose={() => setShowReceiveModal(false)}
          onSuccess={() => {
            setShowReceiveModal(false);
            load(); // refresh inventory
          }}
        />
      )}

      {activeImage && (
        <div className="image-lightbox" onClick={() => setActiveImage(null)}>
          <img src={activeImage} />
        </div>
      )}
    </div>
  );
}
