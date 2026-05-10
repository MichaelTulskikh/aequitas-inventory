import { useEffect, useState } from "react";
import {
  fetchInventoryValuationLots,
  fetchInventoryValueSummary,
  updateInventoryLotValue,
  type InventoryValuationLot,
} from "../../api/inventoryValuation";
import styles from "./InventoryValuationPage.module.css";

function formatLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatAttributeValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.join(", ");
  return String(value);
}

function formatMoney(
  value: number | string | null | undefined,
  currency: "UAH" | "USD" | "EUR" | "GBP" = "UAH",
) {
  if (value === null || value === undefined || value === "") return "—";

  const n = Number(value);
  if (!Number.isFinite(n)) return "—";

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export default function InventoryValuationPage() {
  const [loading, setLoading] = useState(false);
  const [savingLotId, setSavingLotId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [displayCurrency, setDisplayCurrency] = useState<
    "UAH" | "USD" | "EUR" | "GBP"
  >("UAH");
  const [fxRates, setFxRates] = useState<Record<string, number>>({
    UAH: 1,
    USD: 1,
    GBP: 1,
    EUR: 1,
  });
  const [fxLoading, setFxLoading] = useState(false);

  const [lots, setLots] = useState<InventoryValuationLot[]>([]);
  const [summary, setSummary] = useState<{
    current_inventory_value_uah: string;
    distributed_value_uah: string;
    combined_total_value_uah: string;
    unvalued_lot_count: number;
    unvalued_ship_txn_count: number;
  } | null>(null);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [valueFilter, setValueFilter] = useState<"missing" | "valued" | "all">(
    "missing",
  );

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [editState, setEditState] = useState<
    Record<string, { unit_value_uah: string; value_note: string }>
  >({});

  async function loadData() {
    try {
      setLoading(true);
      setError(null);

      const [listRes, summaryRes] = await Promise.all([
        fetchInventoryValuationLots({
          q: search || undefined,
          value_filter: valueFilter,
          page,
          page_size: pageSize,
        }),
        fetchInventoryValueSummary(),
      ]);

      setLots(listRes.lots || []);
      setSummary(summaryRes);

      const nextEditState: Record<
        string,
        { unit_value_uah: string; value_note: string }
      > = {};

      for (const lot of listRes.lots || []) {
        nextEditState[lot.inventory_lot_id] = {
          unit_value_uah:
            lot.unit_value_uah === null ? "" : String(lot.unit_value_uah),
          value_note: lot.value_note || "",
        };
      }

      setEditState(nextEditState);
    } catch (err: any) {
      setError(err?.message || "Failed to load inventory valuation page");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [search, valueFilter, page, pageSize]);

  useEffect(() => {
    let cancelled = false;

    async function loadFxRates() {
      try {
        setFxLoading(true);

        const res = await fetch(
          "https://api.frankfurter.dev/v2/rates?base=UAH&quotes=USD,EUR,GBP",
        );
        if (!res.ok) {
          throw new Error("Failed to load FX rates");
        }

        const data: Array<{
          date: string;
          base: string;
          quote: "EUR" | "GBP" | "USD";
          rate: number;
        }> = await res.json();

        if (cancelled) return;

        const nextRates: Record<"UAH" | "USD" | "EUR" | "GBP", number> = {
          UAH: 1,
          USD: 1,
          EUR: 1,
          GBP: 1,
        };

        for (const row of data) {
          if (
            row.base === "UAH" &&
            (row.quote === "USD" ||
              row.quote === "EUR" ||
              row.quote === "GBP") &&
            typeof row.rate === "number"
          ) {
            nextRates[row.quote] = row.rate;
          }
        }

        setFxRates(nextRates);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setFxLoading(false);
        }
      }
    }

    loadFxRates();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(lotId: string) {
    const draft = editState[lotId];
    if (!draft) return;

    const raw = draft.unit_value_uah.trim();
    let parsedValue: number | null = null;

    if (raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0) {
        setError("Unit value must be a non-negative number or blank.");
        return;
      }
      parsedValue = n;
    }

    try {
      setSavingLotId(lotId);
      setError(null);

      await updateInventoryLotValue(lotId, {
        unit_value_uah: parsedValue,
        value_note: draft.value_note.trim() || null,
      });

      await loadData();
    } catch (err: any) {
      setError(err?.message || "Failed to save lot valuation");
    } finally {
      setSavingLotId(null);
    }
  }

  function convertFromUAH(
    value: number | string | null | undefined,
    currency: "UAH" | "USD" | "EUR" | "GBP",
    rates: Record<string, number>,
  ) {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    if (!Number.isFinite(n)) return null;

    if (currency === "UAH") return n;

    const rate = rates[currency];
    if (!rate || !Number.isFinite(rate)) return null;

    return n * rate;
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <h1 className={styles.title}>Inventory Valuation</h1>
        <p className={styles.subtitle}>
          Track and update UAH value for inventory lots. Default view shows lots
          that still need valuation.
        </p>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}

      <div className={styles.filters}>
        <div className="filter-group">
          <label>Display Currency</label>
          <select
            value={displayCurrency}
            onChange={(e) =>
              setDisplayCurrency(
                e.target.value as "UAH" | "USD" | "EUR" | "GBP",
              )
            }
          >
            <option value="UAH">UAH</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
      </div>

      <div className={`muted ${styles.currencyHint}`}>
        {displayCurrency === "UAH"
          ? "Showing stored database values"
          : fxLoading
            ? "Loading live FX rate..."
            : "Converted from UAH using latest reference rate"}
      </div>

      {summary && (
        <div className={styles.summaryGrid}>
          <div className="summary-stat">
            <div className="summary-stat-label">Current Inventory</div>
            <div className="summary-stat-value">
              {formatMoney(
                convertFromUAH(
                  summary.current_inventory_value_uah,
                  displayCurrency,
                  fxRates,
                ),
                displayCurrency,
              )}
            </div>
          </div>

          <div className="summary-stat">
            <div className="summary-stat-label">Distributed</div>
            <div className="summary-stat-value">
              {formatMoney(
                convertFromUAH(
                  summary.distributed_value_uah,
                  displayCurrency,
                  fxRates,
                ),
                displayCurrency,
              )}
            </div>
          </div>

          <div className="summary-stat">
            <div className="summary-stat-label">Combined Total</div>
            <div className="summary-stat-value">
              {formatMoney(
                convertFromUAH(
                  summary.combined_total_value_uah,
                  displayCurrency,
                  fxRates,
                ),
                displayCurrency,
              )}
            </div>
          </div>

          <div className="summary-stat">
            <div className="summary-stat-label">Unvalued Lots</div>
            <div className="summary-stat-value">
              {summary.unvalued_lot_count}
            </div>
          </div>
        </div>
      )}

      <div className={styles.filters}>
        <div className="filter-group search">
          <label>Search</label>
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={() => {
              setSearch(searchDraft.trim());
              setPage(1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                setSearch(searchDraft.trim());
                setPage(1);
              }
            }}
            placeholder="Search item, location, source..."
          />
        </div>

        <div className="filter-group">
          <label>Value Filter</label>
          <select
            value={valueFilter}
            onChange={(e) => {
              setValueFilter(e.target.value as "missing" | "valued" | "all");
              setPage(1);
            }}
          >
            <option value="missing">Missing only</option>
            <option value="valued">Valued only</option>
            <option value="all">All lots</option>
          </select>
        </div>
      </div>

      <div className={styles.tableWrap}>
        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            <span>Loading valuation lots…</span>
          </div>
        ) : (
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Item / Lot</th>
                <th>Location</th>
                <th>Attributes</th>
                <th>On Hand</th>
                <th>Available</th>
                <th>Unit Value (UAH)</th>
                <th>Total On Hand Value</th>
                <th>Note</th>
                <th>Last Valued</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {lots.map((lot) => {
                const draft = editState[lot.inventory_lot_id] || {
                  unit_value_uah: "",
                  value_note: "",
                };

                return (
                  <tr key={lot.inventory_lot_id}>
                    <td>
                      <div className={styles.itemCell}>
                        <div className={styles.itemName}>{lot.item_name}</div>
                        <div className={styles.itemSub}>
                          Lot: {lot.inventory_lot_id}
                        </div>
                        <div className={styles.itemSub}>
                          Status: {formatLabel(lot.status)}
                        </div>
                      </div>
                    </td>

                    <td>{lot.location_path?.join(" / ") || "—"}</td>

                    <td>
                      <div className="attribute-list">
                        {Object.entries(lot.attributes || {}).length === 0 ? (
                          <span className="muted">No attributes</span>
                        ) : (
                          Object.entries(lot.attributes).map(([key, value]) => (
                            <span key={key} className="attribute-pill">
                              {formatLabel(key)}: {formatAttributeValue(value)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>

                    <td>{lot.quantity_on_hand}</td>
                    <td>{lot.available_quantity}</td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.unit_value_uah}
                        onChange={(e) =>
                          setEditState((prev) => ({
                            ...prev,
                            [lot.inventory_lot_id]: {
                              ...prev[lot.inventory_lot_id],
                              unit_value_uah: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>

                    <td>{formatMoney(lot.total_on_hand_value_uah)}</td>

                    <td>
                      <textarea
                        rows={2}
                        value={draft.value_note}
                        onChange={(e) =>
                          setEditState((prev) => ({
                            ...prev,
                            [lot.inventory_lot_id]: {
                              ...prev[lot.inventory_lot_id],
                              value_note: e.target.value,
                            },
                          }))
                        }
                      />
                    </td>

                    <td>
                      <div>{formatDate(lot.valued_at)}</div>
                      <div className="muted">{lot.valued_by_name || "—"}</div>
                    </td>

                    <td className={styles.actionsCell}>
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className="app-button"
                          disabled={savingLotId === lot.inventory_lot_id}
                          onClick={() => handleSave(lot.inventory_lot_id)}
                        >
                          {savingLotId === lot.inventory_lot_id
                            ? "Saving..."
                            : "Save"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && lots.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className={styles.empty}>
                      No lots match the current valuation filter.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="pagination">
        <div className="pagination-group">
          <button
            className="page-btn"
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
        </div>

        <span className="page-status">Page {page}</span>

        <div className="pagination-group">
          <button
            className="page-btn"
            disabled={loading || lots.length < pageSize}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>

        <div className="page-size-control">
          <label>Rows</label>
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
    </div>
  );
}
