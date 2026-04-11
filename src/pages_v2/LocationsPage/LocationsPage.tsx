import { useEffect, useMemo, useState } from "react";
import {
  createLocation,
  fetchLocations,
  updateLocation,
  type AdminLocation,
} from "../../api/locationsAdmin";
import styles from "./LocationsPage.module.css";

type LocationForm = {
  name: string;
  code: string;
  parent_location_id: string;
  type: string;
  is_active: boolean;
};

type LocationNode = AdminLocation & {
  children: LocationNode[];
};

function emptyLocationForm(): LocationForm {
  return {
    name: "",
    code: "",
    parent_location_id: "",
    type: "warehouse",
    is_active: true,
  };
}

function naturalCompare(a: string, b: string) {
  return a.localeCompare(b, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractTrailingNumber(
  value: string | null | undefined,
  prefix: string,
): number | null {
  if (!value) return null;

  const escapedPrefix = escapeRegExp(prefix);
  const match = value.match(new RegExp(`^${escapedPrefix}(\\d+)$`, "i"));
  if (!match) return null;

  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function getDepth(location: AdminLocation) {
  return Math.max(0, (location.path?.length || 1) - 1);
}

function sortLocationsForDisplay(locations: AdminLocation[]) {
  return [...locations].sort((a, b) =>
    naturalCompare(
      (a.path || [a.name]).join(" / "),
      (b.path || [b.name]).join(" / "),
    ),
  );
}

function allowedTypesForParent(parentType: string | null) {
  if (!parentType) return ["warehouse"];
  if (parentType === "warehouse") return ["pallet"];
  if (parentType === "pallet") return ["box"];
  return [];
}

function allowedParentTypesForLocation(locationType: string) {
  if (locationType === "warehouse") return [];
  if (locationType === "pallet") return ["warehouse"];
  if (locationType === "box") return ["pallet"];
  return [];
}

function buildLocationTree(locations: AdminLocation[]): LocationNode[] {
  const map = new Map<string, LocationNode>();
  const roots: LocationNode[] = [];

  for (const loc of locations) {
    map.set(loc.id, {
      ...loc,
      children: [],
    });
  }

  for (const loc of locations) {
    const node = map.get(loc.id)!;
    const parentId = loc.parent_location_id;

    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortNodes(nodes: LocationNode[]) {
    nodes.sort((a, b) => {
      const typeCompare = naturalCompare(a.type || "", b.type || "");
      if (typeCompare !== 0) return typeCompare;

      const nameCompare = naturalCompare(a.name || "", b.name || "");
      if (nameCompare !== 0) return nameCompare;

      return naturalCompare(a.code || "", b.code || "");
    });

    for (const node of nodes) {
      sortNodes(node.children);
    }
  }

  sortNodes(roots);
  return roots;
}

export default function LocationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [locations, setLocations] = useState<AdminLocation[]>([]);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const [showForm, setShowForm] = useState(false);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(
    null,
  );
  const [form, setForm] = useState<LocationForm>(emptyLocationForm());

  const locationOptions = useMemo(
    () => sortLocationsForDisplay(locations),
    [locations],
  );

  const locationTree = useMemo(() => buildLocationTree(locations), [locations]);

  const selectedParent = useMemo(
    () => locations.find((loc) => loc.id === form.parent_location_id) || null,
    [locations, form.parent_location_id],
  );

  const allowedTypes = useMemo(
    () => allowedTypesForParent(selectedParent?.type || null),
    [selectedParent],
  );

  const allowedParentTypes = useMemo(
    () => allowedParentTypesForLocation(form.type),
    [form.type],
  );

  const allowedParentOptions = useMemo(() => {
    if (form.type === "warehouse") return [];

    return locationOptions.filter(
      (loc) =>
        loc.id !== editingLocationId &&
        allowedParentTypes.includes(loc.type || ""),
    );
  }, [locationOptions, form.type, allowedParentTypes, editingLocationId]);

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetchLocations();
      const nextLocations = res.locations || [];

      setLocations(nextLocations);

      setExpandedIds((prev) => {
        const next = { ...prev };

        for (const loc of nextLocations) {
          if (prev[loc.id] === undefined) {
            next[loc.id] = loc.type === "warehouse";
          }
        }

        return next;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load locations");
    } finally {
      setLoading(false);
    }
  }

  function getNextPalletNumber(warehouseId: string, warehouseCode: string) {
    const pallets = locations.filter(
      (loc) => loc.parent_location_id === warehouseId && loc.type === "pallet",
    );

    const nums = pallets
      .map((loc) => extractTrailingNumber(loc.code || "", `${warehouseCode}-P`))
      .filter((n): n is number => n !== null);

    return nums.length ? Math.max(...nums) + 1 : 1;
  }

  function getNextBoxNumber(palletId: string, palletCode: string) {
    const boxes = locations.filter(
      (loc) => loc.parent_location_id === palletId && loc.type === "box",
    );

    const nums = boxes
      .map((loc) => extractTrailingNumber(loc.code || "", `${palletCode}-B`))
      .filter((n): n is number => n !== null);

    return nums.length ? Math.max(...nums) + 1 : 1;
  }

  function generateCodeAndName(
    parentLocationId: string,
    type: string,
  ): { name: string; code: string } | null {
    const parent = locations.find((loc) => loc.id === parentLocationId);
    if (!parent) return null;

    if (type === "pallet" && parent.type === "warehouse") {
      const warehouseCode = (parent.code || "").trim();
      if (!warehouseCode) return null;

      const nextNumber = getNextPalletNumber(parent.id, warehouseCode);

      return {
        name: `Pallet ${nextNumber}`,
        code: `${warehouseCode}-P${nextNumber}`,
      };
    }

    if (type === "box" && parent.type === "pallet") {
      const palletCode = (parent.code || "").trim();
      if (!palletCode) return null;

      const nextNumber = getNextBoxNumber(parent.id, palletCode);

      return {
        name: `Box ${nextNumber}`,
        code: `${palletCode}-B${nextNumber}`,
      };
    }

    return null;
  }

  function resetMessages() {
    setError(null);
    setSuccess(null);
  }

  function openCreate() {
    setEditingLocationId(null);
    setForm(emptyLocationForm());
    resetMessages();
    setShowForm(true);
  }

  function openEdit(location: AdminLocation) {
    setEditingLocationId(location.id);
    resetMessages();

    setForm({
      name: location.name || "",
      code: location.code || "",
      parent_location_id: location.parent_location_id || "",
      type: location.type || "warehouse",
      is_active: location.is_active ?? true,
    });

    setShowForm(true);
  }

  function openCreateChild(
    parent: AdminLocation,
    childType: string,
    presetName = "",
    presetCode = "",
  ) {
    setEditingLocationId(null);
    resetMessages();

    setForm({
      name: presetName,
      code: presetCode,
      parent_location_id: parent.id,
      type: childType,
      is_active: true,
    });

    setShowForm(true);

    setExpandedIds((prev) => ({
      ...prev,
      [parent.id]: true,
    }));
  }

  function openCreateNextPallet(warehouse: AdminLocation) {
    const warehouseCode = (warehouse.code || "").trim();

    if (!warehouseCode) {
      setError("Warehouse must have a code before creating pallets.");
      return;
    }

    const nextNumber = getNextPalletNumber(warehouse.id, warehouseCode);

    openCreateChild(
      warehouse,
      "pallet",
      `Pallet ${nextNumber}`,
      `${warehouseCode}-P${nextNumber}`,
    );
  }

  function openCreateNextBox(pallet: AdminLocation) {
    const palletCode = (pallet.code || "").trim();

    if (!palletCode) {
      setError("Pallet must have a code before creating boxes.");
      return;
    }

    const nextNumber = getNextBoxNumber(pallet.id, palletCode);

    openCreateChild(
      pallet,
      "box",
      `Box ${nextNumber}`,
      `${palletCode}-B${nextNumber}`,
    );
  }

  function closeForm() {
    setEditingLocationId(null);
    setForm(emptyLocationForm());
    setShowForm(false);
  }

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function expandAll() {
    const next: Record<string, boolean> = {};

    for (const loc of locations) {
      next[loc.id] = true;
    }

    setExpandedIds(next);
  }

  function collapseAll() {
    const next: Record<string, boolean> = {};

    for (const loc of locations) {
      next[loc.id] = false;
    }

    setExpandedIds(next);
  }

  function updateForm<K extends keyof LocationForm>(
    key: K,
    value: LocationForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    resetMessages();

    if (!form.name.trim()) {
      setError("Location name is required.");
      return;
    }

    if (!form.type) {
      setError("Location type is required.");
      return;
    }

    const validTypes = allowedTypesForParent(selectedParent?.type || null);

    if (!validTypes.includes(form.type)) {
      setError("This location type is not allowed under the selected parent.");
      return;
    }

    if (form.type === "warehouse" && form.parent_location_id) {
      setError("Warehouses cannot have a parent.");
      return;
    }

    if (form.type === "pallet") {
      if (!selectedParent || selectedParent.type !== "warehouse") {
        setError("Pallets can only have a warehouse as parent.");
        return;
      }
    }

    if (form.type === "box") {
      if (!selectedParent || selectedParent.type !== "pallet") {
        setError("Boxes can only have a pallet as parent.");
        return;
      }
    }

    try {
      setSaving(true);

      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || null,
        parent_location_id: form.parent_location_id || null,
        type: form.type,
        is_active: form.is_active,
      };

      if (editingLocationId) {
        await updateLocation(editingLocationId, payload);
        setSuccess("Location updated.");
      } else {
        await createLocation(payload);
        setSuccess("Location created.");
      }

      closeForm();
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save location");
    } finally {
      setSaving(false);
    }
  }

  function renderNode(node: LocationNode, depth = 0): React.ReactNode {
    const hasChildren = node.children.length > 0;
    const expanded = expandedIds[node.id] ?? true;

    return (
      <div key={node.id} className={styles.treeNode}>
        <div
          className={styles.treeRow}
          style={{ paddingLeft: `${12 + depth * 22}px` }}
        >
          <button
            type="button"
            className={styles.treeExpander}
            onClick={() => hasChildren && toggleExpanded(node.id)}
            disabled={!hasChildren}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {hasChildren ? (expanded ? "▾" : "▸") : "•"}
          </button>

          <div className={styles.treeMain}>
            <div className={styles.treeTitleRow}>
              <div className={styles.treeName}>{node.name}</div>

              <span className={`${styles.typeChip} ${styles[`type_${node.type}`]}`}>
                {node.type}
              </span>

              {!node.is_active && (
                <span className={styles.inactiveChip}>Inactive</span>
              )}
            </div>

            <div className={styles.treeMeta}>
              <span>
                <strong>Code:</strong> {node.code || "—"}
              </span>
              <span>
                <strong>Path:</strong> {(node.path || [node.name]).join(" / ")}
              </span>
            </div>
          </div>

          <div className={styles.treeActions}>
            <button
              className="secondary-button"
              onClick={() => openEdit(node)}
              type="button"
            >
              Edit
            </button>

            {node.type === "warehouse" && (
              <button
                className="secondary-button"
                onClick={() => openCreateNextPallet(node)}
                type="button"
              >
                Next Pallet
              </button>
            )}

            {node.type === "pallet" && (
              <button
                className="app-button"
                onClick={() => openCreateNextBox(node)}
                type="button"
              >
                Next Box
              </button>
            )}
          </div>
        </div>

        {hasChildren && expanded && (
          <div className={styles.treeChildren}>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (editingLocationId) return;
    if (!showForm) return;

    const parent =
      locations.find((loc) => loc.id === form.parent_location_id) || null;

    const nextAllowedTypes = allowedTypesForParent(parent?.type || null);

    if (!nextAllowedTypes.includes(form.type)) {
      updateForm("type", nextAllowedTypes[0] || "warehouse");
    }
  }, [
    editingLocationId,
    showForm,
    form.parent_location_id,
    form.type,
    locations,
  ]);

  useEffect(() => {
    if (form.type === "warehouse") {
      if (form.parent_location_id) {
        updateForm("parent_location_id", "");
      }
      return;
    }

    if (!form.parent_location_id) return;

    const parent = locations.find((loc) => loc.id === form.parent_location_id);

    if (!parent) {
      updateForm("parent_location_id", "");
      return;
    }

    const allowed = allowedParentTypesForLocation(form.type);

    if (!allowed.includes(parent.type || "")) {
      updateForm("parent_location_id", "");
    }
  }, [form.type, form.parent_location_id, locations]);

  useEffect(() => {
    if (editingLocationId) return;
    if (!showForm) return;
    if (!form.parent_location_id || !form.type) return;

    const generated = generateCodeAndName(form.parent_location_id, form.type);
    if (!generated) return;

    setForm((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : generated.name,
      code: generated.code,
    }));
  }, [
    editingLocationId,
    showForm,
    form.parent_location_id,
    form.type,
    locations,
  ]);

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Locations</h1>
          <p className={styles.subtitle}>
            Manage warehouse hierarchy and storage structure.
          </p>
        </div>

        <button className="app-button" onClick={openCreate} type="button">
          New Location
        </button>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      {showForm && (
        <section className="panel">
          <div className="panel-header">
            <h2>{editingLocationId ? "Edit Location" : "Create Location"}</h2>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className="my-profile-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  disabled={saving}
                  placeholder="Location display name"
                />
              </div>

              <div className="form-group">
                <label>Code</label>
                <input
                  value={form.code}
                  onChange={(e) => updateForm("code", e.target.value)}
                  disabled={saving}
                  placeholder="Auto-generated for pallet and box"
                />
              </div>

              <div className="form-group">
                <label>Parent Location</label>
                <select
                  value={form.parent_location_id}
                  onChange={(e) =>
                    updateForm("parent_location_id", e.target.value)
                  }
                  disabled={saving || form.type === "warehouse"}
                >
                  <option value="">
                    {form.type === "warehouse"
                      ? "No parent (warehouse)"
                      : "Select parent"}
                  </option>

                  {allowedParentOptions.map((loc) => {
                    const indent = "— ".repeat(getDepth(loc));

                    return (
                      <option key={loc.id} value={loc.id}>
                        {indent}
                        {loc.name} [{loc.type}]
                      </option>
                    );
                  })}
                </select>

                <div className="form-help">
                  {form.type === "warehouse" &&
                    "Warehouses do not have a parent."}
                  {form.type === "pallet" &&
                    "Pallets can only be moved under warehouses."}
                  {form.type === "box" &&
                    "Boxes can only be moved under pallets."}
                </div>
              </div>

              <div className="form-group">
                <label>Type</label>
                <select
                  value={form.type}
                  onChange={(e) => updateForm("type", e.target.value)}
                  disabled={saving}
                >
                  {allowedTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group small">
                <label>Flags</label>
                <label className="shipment-toggle">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateForm("is_active", e.target.checked)}
                    disabled={saving}
                  />
                  <span>Active</span>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" className="app-button" disabled={saving}>
                {saving
                  ? "Saving..."
                  : editingLocationId
                    ? "Save Location"
                    : "Create Location"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Location Tree</h2>

          <div className={styles.treeToolbar}>
            <button
              type="button"
              className="secondary-button"
              onClick={expandAll}
              disabled={loading || locations.length === 0}
            >
              Expand All
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={collapseAll}
              disabled={loading || locations.length === 0}
            >
              Collapse All
            </button>
          </div>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            <span>Loading locations…</span>
          </div>
        ) : locations.length === 0 ? (
          <div className="dashboard-empty">No locations found.</div>
        ) : (
          <div className={styles.tree}>
            {locationTree.map((node) => renderNode(node))}
          </div>
        )}
      </section>
    </div>
  );
}
