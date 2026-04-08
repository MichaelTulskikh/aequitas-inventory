import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchInventoryItems,
  fetchInventoryItemAttributeDefinitions,
  fetchInventoryLocationsTree,
  receiveInventory,
} from "../api/inventory";
import {
  fetchInboundShipments,
  type InboundShipment,
} from "../api/inboundShipments";
import {
  attachLotImage,
  requestLotImageUploadUrl,
  uploadFileToPresignedUrl,
} from "../api/media";
import "../styles_new/receive-inventory.css";
import AppModal from "../components/AppModal";
import LocationQuickCreateForm from "../components/LocationQuickCreateForm";

type InventoryItemOption = {
  id: string;
  name: string;
  description?: string | null;
  default_unit: string;
  is_internal_only?: boolean;
  category?: {
    id: string;
    name: string;
    path: string[];
  } | null;
};

type ItemAttributeDefinition = {
  id: string;
  item_id: string;
  attribute_key: string;
  label: string;
  data_type: "text" | "number" | "date" | "boolean" | "enum";
  is_required: boolean;
  allowed_values?: unknown[];
  sort_order?: number;
};

type LocationNode = {
  id: string;
  parent_location_id?: string | null;
  name: string;
  code?: string | null;
  type: string;
  is_active?: boolean;
  path: string[];
};

// function locationSearchText(location: LocationNode) {
//   return [
//     location.name,
//     location.code || "",
//     location.type || "",
//     location.path?.join(" ") || "",
//   ]
//     .join(" ")
//     .toLowerCase();
// }

// function rankAndFilterLocations(
//   locations: LocationNode[],
//   query: string,
// ): LocationNode[] {
//   const normalized = query.trim().toLowerCase();

//   if (!normalized) {
//     return [...locations]
//       .sort((a, b) =>
//         formatPath(a.path).localeCompare(formatPath(b.path), undefined, {
//           numeric: true,
//         }),
//       )
//       .slice(0, 100);
//   }

//   const scored = locations
//     .map((location) => {
//       const name = location.name.toLowerCase();
//       const code = (location.code || "").toLowerCase();
//       const type = location.type.toLowerCase();
//       const fullPath = formatPath(location.path).toLowerCase();
//       const full = locationSearchText(location);

//       let score = 0;

//       if (name === normalized) score += 1000;
//       if (name.startsWith(normalized)) score += 500;
//       if (name.includes(normalized)) score += 250;
//       if (code === normalized) score += 220;
//       if (code.includes(normalized)) score += 140;
//       if (fullPath.includes(normalized)) score += 120;
//       if (type.includes(normalized)) score += 60;
//       if (full.includes(normalized)) score += 25;

//       return { location, score };
//     })
//     .filter((entry) => entry.score > 0)
//     .sort((a, b) => {
//       if (b.score !== a.score) return b.score - a.score;
//       return formatPath(a.location.path).localeCompare(
//         formatPath(b.location.path),
//         undefined,
//         { numeric: true },
//       );
//     });

//   return scored.slice(0, 100).map((entry) => entry.location);
// }

function getCurrentLocalDateTime() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function formatPath(path?: string[]) {
  return path?.length ? path.join(" / ") : "—";
}

function buildAttributeInitialValue(def: ItemAttributeDefinition) {
  if (def.data_type === "boolean") return false;
  return "";
}

function normalizeAttributeValue(
  def: ItemAttributeDefinition,
  value: unknown,
): unknown {
  if (def.data_type === "boolean") {
    return Boolean(value);
  }

  if (def.data_type === "number") {
    if (value === "" || value === null || value === undefined) return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : value;
  }

  if (value === "") return null;
  return value;
}

function renderInput(
  def: ItemAttributeDefinition,
  value: unknown,
  onChange: (next: unknown) => void,
) {
  switch (def.data_type) {
    case "boolean":
      return (
        <label className="checkbox-field">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>Yes</span>
        </label>
      );

    case "number":
      return (
        <input
          type="number"
          step="any"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "enum":
      return (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select</option>
          {(Array.isArray(def.allowed_values) ? def.allowed_values : []).map(
            (option) => (
              <option key={String(option)} value={String(option)}>
                {String(option)}
              </option>
            ),
          )}
        </select>
      );

    case "text":
    default:
      return (
        <input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase();
}

function itemSearchText(item: InventoryItemOption) {
  return [
    item.name,
    item.description || "",
    item.default_unit,
    item.category?.name || "",
    item.category?.path?.join(" ") || "",
  ]
    .join(" ")
    .toLowerCase();
}

function rankAndFilterItems(
  items: InventoryItemOption[],
  query: string,
): InventoryItemOption[] {
  const normalized = normalizeSearchValue(query);

  if (!normalized) {
    return [...items]
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      )
      .slice(0, 25);
  }

  const scored = items
    .map((item) => {
      const name = item.name.toLowerCase();
      const categoryPath = (item.category?.path || [])
        .join(" / ")
        .toLowerCase();
      const description = (item.description || "").toLowerCase();
      const full = itemSearchText(item);

      let score = 0;

      if (name === normalized) score += 1000;
      if (name.startsWith(normalized)) score += 500;
      if (name.includes(normalized)) score += 250;
      if (categoryPath.includes(normalized)) score += 100;
      if (description.includes(normalized)) score += 50;
      if (full.includes(normalized)) score += 25;

      return { item, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.item.name.localeCompare(b.item.name, undefined, {
        numeric: true,
      });
    });

  return scored.slice(0, 30).map((entry) => entry.item);
}

type ReceiveInventoryItemPickerProps = {
  items: InventoryItemOption[];
  value: string;
  disabled?: boolean;
  onChange: (itemId: string) => void;
};

function ReceiveInventoryItemPicker({
  items,
  value,
  disabled = false,
  onChange,
}: ReceiveInventoryItemPickerProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = "ri-page-item-listbox";

  const selectedItem = useMemo(
    () => items.find((item) => item.id === value) || null,
    [items, value],
  );

  const filteredItems = useMemo(
    () => rankAndFilterItems(items, query),
    [items, query],
  );

  useEffect(() => {
    if (selectedItem) {
      setQuery(selectedItem.name);
    } else {
      setQuery("");
    }
  }, [selectedItem]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(item: InventoryItemOption) {
    onChange(item.id);
    setQuery(item.name);
    setOpen(false);
    setHighlightedIndex(0);
  }

  function handleClear() {
    onChange("");
    setQuery("");
    setOpen(false);
    setHighlightedIndex(0);
  }

  return (
    <div
      ref={rootRef}
      className={`ri-page__item-picker ${open ? "ri-page__item-picker--open" : ""}`}
    >
      <div className="ri-page__item-input-row">
        <input
          type="text"
          value={query}
          placeholder="Search item name, category, description..."
          disabled={disabled}
          autoComplete="off"
          className="ri-page__item-input"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            setOpen(true);

            if (selectedItem && next.trim() !== selectedItem.name) {
              onChange("");
            }
          }}
          onKeyDown={(e) => {
            if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
              setOpen(true);
              return;
            }

            if (!filteredItems.length) return;

            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlightedIndex((prev) =>
                Math.min(prev + 1, filteredItems.length - 1),
              );
            }

            if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlightedIndex((prev) => Math.max(prev - 1, 0));
            }

            if (e.key === "Enter" && open) {
              e.preventDefault();
              const item = filteredItems[highlightedIndex];
              if (item) handleSelect(item);
            }

            if (e.key === "Escape") {
              setOpen(false);
            }
          }}
        />

        {query && !disabled && (
          <button
            type="button"
            className="ri-page__item-clear"
            onClick={handleClear}
            aria-label="Clear selected item"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="ri-page__item-dropdown-shell">
          <div id={listboxId} className="ri-page__item-dropdown" role="listbox">
            {filteredItems.length === 0 ? (
              <div className="ri-page__item-empty">
                No matching items found.
              </div>
            ) : (
              filteredItems.map((item, index) => {
                const active = index === highlightedIndex;
                const categoryPath = item.category?.path?.length
                  ? item.category.path.join(" / ")
                  : "";

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className={`ri-page__item-option ${
                      active ? "ri-page__item-option--active" : ""
                    }`}
                  >
                    <div className="ri-page__item-option-top">
                      <strong className="ri-page__item-option-name">
                        {item.name}
                      </strong>

                      <span className="ri-page__item-option-unit">
                        {item.default_unit}
                      </span>
                    </div>

                    {categoryPath && (
                      <div className="ri-page__item-option-meta">
                        {categoryPath}
                      </div>
                    )}

                    {/* {item.description && (
                      <div className="ri-page__item-option-desc">
                        {item.description}
                      </div>
                    )} */}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type ReceiveInventoryLocationPickerModalProps = {
  open: boolean;
  locations: LocationNode[];
  value: string;
  onClose: () => void;
  onConfirm: (locationId: string) => void;
};

function ReceiveInventoryLocationPickerModal({
  open,
  locations,
  value,
  onClose,
  onConfirm,
}: ReceiveInventoryLocationPickerModalProps) {
  const [query, setQuery] = useState("");
  const [draftLocationId, setDraftLocationId] = useState(value);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) return;

    setDraftLocationId(value);
    setQuery("");

    const nextExpanded: Record<string, boolean> = {};
    const selected = locations.find((loc) => loc.id === value);

    if (selected?.path?.length) {
      for (let i = 0; i < selected.path.length; i += 1) {
        const partialPath = selected.path.slice(0, i + 1);
        const match = locations.find(
          (loc) =>
            loc.path.length === partialPath.length &&
            loc.path.every((segment, index) => segment === partialPath[index]),
        );
        if (match) {
          nextExpanded[match.id] = true;
        }
      }
    }

    setExpandedIds(nextExpanded);
  }, [open, value, locations]);

  const childrenByParent = useMemo(() => {
    const map = new Map<string | null, LocationNode[]>();

    for (const location of locations) {
      const parentId = location.parent_location_id ?? null;
      const siblings = map.get(parentId) || [];
      siblings.push(location);
      map.set(parentId, siblings);
    }

    for (const [, nodes] of map) {
      nodes.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true }),
      );
    }

    return map;
  }, [locations]);

  const filteredLocationIds = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return null;

    const matched = new Set<string>();

    for (const location of locations) {
      const haystack = [
        location.name,
        location.code || "",
        location.type || "",
        location.path.join(" / "),
      ]
        .join(" ")
        .toLowerCase();

      if (haystack.includes(normalized)) {
        matched.add(location.id);

        let parentId = location.parent_location_id ?? null;
        while (parentId) {
          matched.add(parentId);
          const parent = locations.find((loc) => loc.id === parentId);
          parentId = parent?.parent_location_id ?? null;
        }
      }
    }

    return matched;
  }, [locations, query]);

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === draftLocationId) || null,
    [locations, draftLocationId],
  );

  function toggleExpanded(locationId: string) {
    setExpandedIds((prev) => ({
      ...prev,
      [locationId]: !prev[locationId],
    }));
  }

  function expandAllVisible() {
    const next: Record<string, boolean> = {};
    for (const location of locations) {
      if (
        childrenByParent.has(location.id) &&
        (filteredLocationIds === null || filteredLocationIds.has(location.id))
      ) {
        next[location.id] = true;
      }
    }
    setExpandedIds(next);
  }

  function collapseAll() {
    setExpandedIds({});
  }

  function renderTree(parentId: string | null, depth = 0): React.ReactNode {
    const nodes = childrenByParent.get(parentId) || [];

    return nodes.map((location) => {
      if (filteredLocationIds && !filteredLocationIds.has(location.id)) {
        return null;
      }

      const children = childrenByParent.get(location.id) || [];
      const hasChildren = children.length > 0;
      const isExpanded = Boolean(expandedIds[location.id]) || Boolean(query.trim());
      const isSelected = location.id === draftLocationId;

      return (
        <div key={location.id} className="ri-page__location-tree-node">
          <div
            className={`ri-page__location-tree-row ${
              isSelected ? "ri-page__location-tree-row--selected" : ""
            }`}
          >
            <div className="ri-page__location-tree-main">
              {hasChildren ? (
                <button
                  type="button"
                  className="ri-page__location-tree-toggle"
                  onClick={() => toggleExpanded(location.id)}
                  aria-label={isExpanded ? "Collapse location" : "Expand location"}
                  aria-expanded={isExpanded}
                >
                  <span
                    className={`ri-page__location-tree-caret ${
                      isExpanded ? "ri-page__location-tree-caret--expanded" : ""
                    }`}
                  >
                    ▸
                  </span>
                </button>
              ) : (
                <span className="ri-page__location-tree-toggle-spacer" />
              )}

              <button
                type="button"
                className="ri-page__location-tree-select"
                onClick={() => setDraftLocationId(location.id)}
              >
                <span
                  className="ri-page__location-tree-select-inner"
                  style={{ paddingLeft: `${depth * 18}px` }}
                >
                  <span className="ri-page__location-tree-name">
                    {location.name}
                  </span>
                  <span className="ri-page__location-tree-type">
                    {location.type}
                  </span>
                </span>

                {/* <span className="ri-page__location-tree-path">
                  {formatPath(location.path)}
                </span> */}

                {/* {location.code && (
                  <span className="ri-page__location-tree-meta">
                    Code: {location.code}
                  </span>
                )} */}
              </button>
            </div>
          </div>

          {hasChildren && isExpanded && (
            <div className="ri-page__location-tree-children">
              {renderTree(location.id, depth + 1)}
            </div>
          )}
        </div>
      );
    });
  }

  if (!open) return null;

  return (
    <AppModal title="Select Location" width="980px" onClose={onClose}>
      <div className="ri-page__location-modal">
        <div className="ri-page__location-modal-topbar">
          <div className="ri-page__location-modal-search">
            <label className="ri-page__location-modal-label">
              Search Location
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, path, code, or type..."
              className="ri-page__location-modal-input"
              autoFocus
            />
          </div>

          <div className="ri-page__location-modal-tools">
            <button
              type="button"
              className="secondary-button"
              onClick={expandAllVisible}
            >
              Expand All
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={collapseAll}
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="ri-page__location-tree-panel">
          {locations.length === 0 ? (
            <div className="ri-page__location-tree-empty">
              No locations available.
            </div>
          ) : filteredLocationIds && filteredLocationIds.size === 0 ? (
            <div className="ri-page__location-tree-empty">
              No matching locations found.
            </div>
          ) : (
            renderTree(null)
          )}
        </div>

        <div className="ri-page__location-modal-preview">
          <h3 className="ri-page__location-modal-preview-title">
            Selected Location
          </h3>

          {selectedLocation ? (
            <div className="ri-page__location-modal-preview-card">
              <div>
                <strong>Name:</strong> {selectedLocation.name}
              </div>
              <div>
                <strong>Path:</strong> {formatPath(selectedLocation.path)}
              </div>
              <div>
                <strong>Type:</strong> {selectedLocation.type}
              </div>
              <div>
                <strong>Code:</strong> {selectedLocation.code || "—"}
              </div>
            </div>
          ) : (
            <div className="ri-page__location-modal-preview-empty">
              No location selected.
            </div>
          )}
        </div>

        <div className="form-actions ri-page__location-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="app-button"
            disabled={!draftLocationId}
            onClick={() => {
              if (!draftLocationId) return;
              onConfirm(draftLocationId);
            }}
          >
            Use Location
          </button>
        </div>
      </div>
    </AppModal>
  );
}

export default function ReceiveInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [items, setItems] = useState<InventoryItemOption[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [inboundShipments, setInboundShipments] = useState<InboundShipment[]>(
    [],
  );
  const [attributeDefs, setAttributeDefs] = useState<ItemAttributeDefinition[]>(
    [],
  );

  const [itemId, setItemId] = useState("");
  const [itemSearch, setItemSearch] = useState("");
  const [itemSearchOpen, setItemSearchOpen] = useState(false);
  const [highlightedItemIndex, setHighlightedItemIndex] = useState(0);
  console.log(itemSearchOpen, highlightedItemIndex); // TODO: REMOVE

  const [locationId, setLocationId] = useState("");
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [inboundShipmentId, setInboundShipmentId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [sourceNote, setSourceNote] = useState("");
  const [status, setStatus] = useState("active");

  const [attributeValues, setAttributeValues] = useState<
    Record<string, unknown>
  >({});

  const [lotImageFiles, setLotImageFiles] = useState<File[]>([]);
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const itemSearchRef = useRef<HTMLDivElement | null>(null);

  const selectedItem = useMemo(
    () => items.find((item) => item.id === itemId) || null,
    [items, itemId],
  );

  const selectedLocation = useMemo(
    () => locations.find((loc) => loc.id === locationId) || null,
    [locations, locationId],
  );

  const selectedInboundShipment = useMemo(
    () => inboundShipments.find((s) => s.id === inboundShipmentId) || null,
    [inboundShipments, inboundShipmentId],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      try {
        setLoading(true);
        setError(null);

        const [itemsRes, locationsRes, inboundShipmentsRes] = await Promise.all(
          [
            fetchInventoryItems(),
            fetchInventoryLocationsTree(),
            fetchInboundShipments(),
          ],
        );

        if (cancelled) return;

        setItems(itemsRes.items || []);
        setLocations(locationsRes.locations || []);
        setInboundShipments(inboundShipmentsRes.shipments || []);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load receive inventory page");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInitial();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAttributes() {
      if (!itemId) {
        setAttributeDefs([]);
        setAttributeValues({});
        return;
      }

      try {
        const res = await fetchInventoryItemAttributeDefinitions(itemId);
        if (cancelled) return;

        const defs = res.attributes || [];
        setAttributeDefs(defs);

        const nextValues: Record<string, unknown> = {};
        for (const def of defs) {
          nextValues[def.attribute_key] = buildAttributeInitialValue(def);
        }
        setAttributeValues(nextValues);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load item attributes");
          setAttributeDefs([]);
          setAttributeValues({});
        }
      }
    }

    loadAttributes();

    return () => {
      cancelled = true;
    };
  }, [itemId]);

  useEffect(() => {
    if (selectedItem) {
      setItemSearch(selectedItem.name);
    }
  }, [selectedItem]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!itemSearchRef.current) return;
      if (!itemSearchRef.current.contains(event.target as Node)) {
        setItemSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    setHighlightedItemIndex(0);
  }, [itemSearch]);

  const requiredMissing = useMemo(() => {
    const missing: string[] = [];

    if (!inboundShipmentId) missing.push("Inbound Shipment");
    if (!itemId) missing.push("Item");
    if (!locationId) missing.push("Location");

    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) missing.push("Quantity");

    for (const def of attributeDefs) {
      if (!def.is_required) continue;

      const raw = attributeValues[def.attribute_key];

      if (def.data_type === "boolean") {
        if (raw !== true) {
          missing.push(def.label);
        }
        continue;
      }

      if (raw === null || raw === undefined || String(raw).trim() === "") {
        missing.push(def.label);
      }
    }

    return missing;
  }, [
    inboundShipmentId,
    itemId,
    locationId,
    quantity,
    attributeDefs,
    attributeValues,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (requiredMissing.length > 0) {
      setError(`Missing required fields: ${requiredMissing.join(", ")}`);
      return;
    }

    const qty = Number(quantity);

    const attributes: Record<string, unknown> = {};
    for (const def of attributeDefs) {
      const normalized = normalizeAttributeValue(
        def,
        attributeValues[def.attribute_key],
      );

      if (
        normalized !== null &&
        normalized !== undefined &&
        normalized !== ""
      ) {
        attributes[def.attribute_key] = normalized;
      }
    }

    try {
      setSaving(true);

      const result = await receiveInventory({
        item_id: itemId,
        location_id: locationId,
        inbound_shipment_id: inboundShipmentId,
        quantity: qty,
        attributes,
        reason: reason || undefined,
        received_at: getCurrentLocalDateTime(),
        source_note: sourceNote || undefined,
        status,
      });

      const lotId = result.inventory_lot_id;

      for (let i = 0; i < lotImageFiles.length; i += 1) {
        const file = lotImageFiles[i];

        const uploadInit = await requestLotImageUploadUrl(lotId, {
          filename: file.name,
          content_type: file.type,
        });

        await uploadFileToPresignedUrl(file, uploadInit.upload_url);

        await attachLotImage(lotId, {
          s3_key: uploadInit.s3_key,
          caption: file.name,
          is_primary: i === 0,
        });
      }

      setSuccess(`Inventory received successfully. Lot: ${lotId}`);

      setQuantity("");
      setReason("");
      setSourceNote("");
      setLotImageFiles([]);
      setItemId("");
      setItemSearch("");
      setLocationId("");
      setInboundShipmentId("");
      setAttributeDefs([]);
      setAttributeValues({});
    } catch (err: any) {
      setError(err?.message || "Failed to receive inventory");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="ri-page">
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading receive inventory form…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="ri-page">
      <div className="ri-page__header">
        <div>
          <h1 className="ri-page__title">Receive Inventory</h1>
          <p className="ri-page__subtitle">
            Receive stock into a matching lot or create a new lot automatically.
          </p>
        </div>
      </div>

      {error && <div className="dashboard-error">Error: {error}</div>}
      {success && <div className="profile-success">{success}</div>}

      <form className="ri-page__layout" onSubmit={handleSubmit}>
        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Shipment, Item and Quantity</h2>
          </div>

          <div className="my-profile-grid">
            <div className="form-group span-2">
              <label>Inbound Shipment *</label>
              <select
                value={inboundShipmentId}
                onChange={(e) => setInboundShipmentId(e.target.value)}
                disabled={saving}
              >
                <option value="">Select inbound shipment</option>
                {inboundShipments.map((shipment) => (
                  <option key={shipment.id} value={shipment.id}>
                    {shipment.inbound_code}
                    {shipment.source_name ? ` — ${shipment.source_name}` : ""}
                    {shipment.status ? ` (${shipment.status})` : ""}
                  </option>
                ))}
              </select>
              {/* <div className="form-help">
                If the shipment does not exist yet, create it on the Inbound
                Shipments page first.
              </div> */}
            </div>

            <div className="form-group">
              <label>Item *</label>

              <ReceiveInventoryItemPicker
                items={items}
                value={itemId}
                disabled={saving}
                onChange={(nextItemId) => {
                  setItemId(nextItemId);

                  if (!nextItemId) {
                    setAttributeDefs([]);
                    setAttributeValues({});
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                min="0"
                step="0.001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="form-group">
              <label>Default Unit</label>
              <input value={selectedItem?.default_unit || ""} disabled />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={saving}
              >
                <option value="active">Active</option>
                <option value="quarantined">Quarantined</option>
                <option value="exhausted">Exhausted</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {selectedItem?.description && (
            <div className="form-help">{selectedItem.description}</div>
          )}
        </section>

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Lot Attributes</h2>
          </div>

          {attributeDefs.length === 0 ? (
            <div className="dashboard-empty">
              No item-specific attributes for this item.
            </div>
          ) : (
            <div className="my-profile-grid">
              {attributeDefs.map((def) => (
                <div className="form-group" key={def.id}>
                  <label>
                    {def.label}
                    {def.is_required ? " *" : ""}
                  </label>

                  {renderInput(
                    def,
                    attributeValues[def.attribute_key],
                    (next) =>
                      setAttributeValues((prev) => ({
                        ...prev,
                        [def.attribute_key]: next,
                      })),
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Location and Source</h2>
          </div>

          <div className="my-profile-grid">
            <div className="form-group span-2">
              <label>Location *</label>

              <div className="ri-page__location-row">
                <button
                  type="button"
                  className="ri-page__location-trigger"
                  onClick={() => setLocationPickerOpen(true)}
                  disabled={saving}
                >
                  <span className="ri-page__location-trigger-label">
                    {selectedLocation
                      ? formatPath(selectedLocation.path)
                      : "Select location"}
                  </span>
                </button>

                {locationId && !saving && (
                  <button
                    type="button"
                    className="ri-page__location-clear-inline"
                    onClick={() => setLocationId("")}
                  >
                    Clear
                  </button>
                )}

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setLocationModalOpen(true)}
                  disabled={saving}
                >
                  New Location
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Reason</label>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={saving}
                placeholder="Donation intake, partner transfer, etc."
              />
            </div>

            <div className="form-group span-2">
              <label>Source Note</label>
              <textarea
                rows={4}
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                disabled={saving}
                placeholder="Optional source / intake details"
              />
            </div>
          </div>
        </section>

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Lot Images</h2>
          </div>

          <div className="form-group">
            <label>Upload or Take Photo</label>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={(e) =>
                setLotImageFiles(Array.from(e.target.files || []))
              }
              disabled={saving}
            />
            <div className="form-help">
              These images will be attached to the received lot and override the
              default item image when present.
            </div>
          </div>

          {lotImageFiles.length > 0 && (
            <div className="form-help">
              Selected files: {lotImageFiles.map((f) => f.name).join(", ")}
            </div>
          )}
        </section>

        <section className="shipment-panel">
          <div className="shipment-panel-header">
            <h2>Review</h2>
          </div>

          <div className="receive-review">
            <div>
              <strong>Inbound Shipment:</strong>{" "}
              {selectedInboundShipment
                ? `${selectedInboundShipment.inbound_code}${
                    selectedInboundShipment.source_name
                      ? ` — ${selectedInboundShipment.source_name}`
                      : ""
                  }`
                : "—"}
            </div>
            <div>
              <strong>Item:</strong> {selectedItem?.name || "—"}
            </div>
            <div>
              <strong>Quantity:</strong> {quantity || "—"}{" "}
              {selectedItem?.default_unit || ""}
            </div>
            <div>
              <strong>Location:</strong>{" "}
              {selectedLocation ? formatPath(selectedLocation.path) : "—"}
            </div>
            <div>
              <strong>Status:</strong> {status}
            </div>
          </div>

          {requiredMissing.length > 0 && (
            <div className="form-help">
              Missing required fields: {requiredMissing.join(", ")}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="app-button"
              disabled={saving || requiredMissing.length > 0}
            >
              {saving ? "Receiving..." : "Receive Inventory"}
            </button>
          </div>
        </section>
      </form>

      {locationModalOpen && (
        <AppModal
          title="Create Location"
          width="720px"
          onClose={() => setLocationModalOpen(false)}
        >
          <LocationQuickCreateForm
            locations={locations}
            initialType="box"
            onCancel={() => setLocationModalOpen(false)}
            onCreated={async (location) => {
              const res = await fetchInventoryLocationsTree();
              const nextLocations = res.locations || [];
              setLocations(nextLocations);
              setLocationId(location.id);
              setLocationModalOpen(false);
            }}
          />
        </AppModal>
      )}

      {locationPickerOpen && (
        <ReceiveInventoryLocationPickerModal
          open={locationPickerOpen}
          locations={locations}
          value={locationId}
          onClose={() => setLocationPickerOpen(false)}
          onConfirm={(nextLocationId) => {
            setLocationId(nextLocationId);
            setLocationPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
