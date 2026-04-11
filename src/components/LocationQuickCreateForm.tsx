import { useEffect, useMemo, useState } from "react";
import { createLocation } from "../api/locationsAdmin";
import styles from "./LocationQuickCreateForm.module.css";

type LocationForm = {
  name: string;
  code: string;
  parent_location_id: string;
  type: "warehouse" | "pallet" | "box";
  is_active: boolean;
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

type Props = {
  locations: LocationOption[];
  initialParentLocationId?: string;
  initialType?: "warehouse" | "pallet" | "box";
  onCreated: (location: { id: string }) => void | Promise<void>;
  onCancel: () => void;
};

function emptyLocationForm(): LocationForm {
  return {
    name: "",
    code: "",
    parent_location_id: "",
    type: "box",
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

function getDepth(location: LocationOption) {
  return Math.max(0, (location.path?.length || 1) - 1);
}

function sortLocationsForDisplay(locations: LocationOption[]) {
  return [...locations].sort((a, b) =>
    naturalCompare(
      (a.path || [a.name]).join(" / "),
      (b.path || [b.name]).join(" / "),
    ),
  );
}

function allowedParentTypesForLocation(locationType: string) {
  if (locationType === "warehouse") return [];
  if (locationType === "pallet") return ["warehouse"];
  if (locationType === "box") return ["pallet"];
  return [];
}

export default function LocationQuickCreateForm({
  locations,
  initialParentLocationId,
  initialType,
  onCreated,
  onCancel,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<"quick" | "manual">("quick");
  const [quickAction, setQuickAction] = useState<"pallet" | "box">(
    initialType === "pallet" ? "pallet" : "box",
  );
  const [quickParentId, setQuickParentId] = useState(
    initialParentLocationId || "",
  );

  const [form, setForm] = useState<LocationForm>(() => ({
    ...emptyLocationForm(),
    parent_location_id: initialParentLocationId || "",
    type: initialType || "box",
  }));

  const locationOptions = useMemo(
    () => sortLocationsForDisplay(locations),
    [locations],
  );

  const selectedParent = useMemo(
    () => locations.find((loc) => loc.id === form.parent_location_id) || null,
    [locations, form.parent_location_id],
  );

  const warehouseOptions = useMemo(
    () => locationOptions.filter((loc) => loc.type === "warehouse"),
    [locationOptions],
  );

  const palletOptions = useMemo(
    () => locationOptions.filter((loc) => loc.type === "pallet"),
    [locationOptions],
  );

  const allowedTypes = useMemo(
    () => ["warehouse", "pallet", "box"] as const,
    [],
  );

  const allowedParentTypes = useMemo(
    () => allowedParentTypesForLocation(form.type),
    [form.type],
  );

  const allowedParentOptions = useMemo(() => {
    if (form.type === "warehouse") return [];

    return locationOptions.filter((loc) =>
      allowedParentTypes.includes(loc.type || ""),
    );
  }, [locationOptions, form.type, allowedParentTypes]);

  function updateForm<K extends keyof LocationForm>(
    key: K,
    value: LocationForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
    type: "pallet" | "box",
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

  const quickGenerated = useMemo(() => {
    if (!quickParentId) return null;
    return generateCodeAndName(quickParentId, quickAction);
  }, [quickParentId, quickAction, locations]);

  useEffect(() => {
    if (mode !== "manual") return;

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
  }, [mode, form.type, form.parent_location_id, locations]);

  useEffect(() => {
    if (mode !== "manual") return;
    if (!form.parent_location_id) return;
    if (form.type !== "pallet" && form.type !== "box") return;

    const generated = generateCodeAndName(form.parent_location_id, form.type);
    if (!generated) return;

    setForm((prev) => ({
      ...prev,
      name: prev.name.trim() ? prev.name : generated.name,
      code: generated.code,
    }));
  }, [mode, form.parent_location_id, form.type, locations]);

  async function handleQuickCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!quickParentId) {
      setError(
        quickAction === "pallet"
          ? "Parent warehouse is required."
          : "Parent pallet is required.",
      );
      return;
    }

    if (!quickGenerated) {
      setError("Could not generate name/code for this location.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: quickGenerated.name,
        code: quickGenerated.code,
        parent_location_id: quickParentId,
        type: quickAction,
        is_active: true,
      };

      const res = await createLocation(payload);
      await onCreated(res.location);
    } catch (err: any) {
      setError(err?.message || "Failed to create location");
    } finally {
      setSaving(false);
    }
  }

  async function handleManualSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Location name is required.");
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
        is_active: true,
      };

      const res = await createLocation(payload);
      await onCreated(res.location);
    } catch (err: any) {
      setError(err?.message || "Failed to create location");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      {error && <div className="alert-error">Error: {error}</div>}

      {/* <div className={`panel-header ${styles.sectionHeader}`}>
        <h3>Create Mode</h3>
      </div> */}

      <div className={styles.modeRow}>
        <label className="shipment-toggle">
          <input
            type="radio"
            name="location-create-mode"
            checked={mode === "quick"}
            onChange={() => setMode("quick")}
            disabled={saving}
          />
          <span>Quick Add</span>
        </label>

        <label className="shipment-toggle">
          <input
            type="radio"
            name="location-create-mode"
            checked={mode === "manual"}
            onChange={() => setMode("manual")}
            disabled={saving}
          />
          <span>Manual</span>
        </label>
      </div>

      {mode === "quick" ? (
        <form className={styles.form} onSubmit={handleQuickCreate}>
          <div className="my-profile-grid">
            <div className="form-group">
              <label>Quick Action</label>
              <select
                value={quickAction}
                onChange={(e) => {
                  const next = e.target.value as "pallet" | "box";
                  setQuickAction(next);
                  setQuickParentId("");
                }}
                disabled={saving}
              >
                <option value="pallet">Next Pallet</option>
                <option value="box">Next Box</option>
              </select>
            </div>

            <div className="form-group">
              <label>
                {quickAction === "pallet"
                  ? "Parent Warehouse"
                  : "Parent Pallet"}
              </label>
              <select
                value={quickParentId}
                onChange={(e) => setQuickParentId(e.target.value)}
                disabled={saving}
              >
                <option value="">Select parent</option>
                {(quickAction === "pallet"
                  ? warehouseOptions
                  : palletOptions
                ).map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {(loc.path || [loc.name]).join(" / ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Generated Name</label>
              <input value={quickGenerated?.name || ""} disabled />
            </div>

            <div className="form-group">
              <label>Generated Code</label>
              <input value={quickGenerated?.code || ""} disabled />
            </div>
          </div>

          <div className={`form-help ${styles.help}`}>
            {quickAction === "pallet" &&
              "Create the next numbered pallet under a warehouse."}
            {quickAction === "box" &&
              "Create the next numbered box under a pallet."}
          </div>

          <div className={`form-actions ${styles.actions}`}>
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" className="app-button" disabled={saving}>
              {saving
                ? "Creating..."
                : quickAction === "pallet"
                  ? "Create Next Pallet"
                  : "Create Next Box"}
            </button>
          </div>
        </form>
      ) : (
        <form className={styles.form} onSubmit={handleManualSave}>
          <div className="my-profile-grid">
            <div className="form-group">
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  updateForm("type", e.target.value as LocationForm["type"])
                }
                disabled={saving}
              >
                {allowedTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
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
            </div>

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
          </div>

          <div className={`form-help ${styles.help}`}>
            {form.type === "warehouse" && "Warehouses do not have a parent."}
            {form.type === "pallet" &&
              "Pallets can only be created under warehouses."}
            {form.type === "box" && "Boxes can only be created under pallets."}
          </div>

          <div className={`form-actions ${styles.actions}`}>
            <button
              type="button"
              className="secondary-button"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>

            <button type="submit" className="app-button" disabled={saving}>
              {saving ? "Creating..." : "Create Location"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
