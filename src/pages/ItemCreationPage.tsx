import { useEffect, useMemo, useState } from "react";
import "../styles/item-creation.css";
import {
  createItem,
  fetchItems,
  fetchItemTypes,
  updateItem,
  type Item,
  type ItemType,
} from "../api/items";
import AttributesEditor from "../components/AttributeEditor";

const SUGGESTED_KEYS: Record<string, string[]> = {
  Medication: ["dosage", "form", "expiration_date", "batch", "notes"],
  "Medical Equipment": ["size", "brand", "model", "expiration_date", "notes"],
  Consumable: ["size", "pack_size", "expiration_date", "notes"],
  Wearables: ["size", "color", "material", "notes"],
};

export default function ItemCreationPage() {
  const [types, setTypes] = useState<ItemType[]>([]);
  const [itemsByType, setItemsByType] = useState<Record<string, Item[]>>({});
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());

  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [editingItem, setEditingItem] = useState<Item | null>(null);

  const [formName, setFormName] = useState("");
  const [formUnit, setFormUnit] = useState("");
  const [formAttrs, setFormAttrs] = useState<Record<string, any>>({});

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const ALLOWED_UNITS = [
    "each", // devices, instruments, single items
    "box", // gloves, syringes
    "pack", // gauze, wipes
    "bag", // IV fluids, disposables
    "case", // bulk storage
    "kit", // procedure kits
    "bottle", // liquids
    "vial", // injectables
    "ampoule", // injectables (EU-style)
    "tube", // creams, gels
    "roll", // bandages
    "sheet", // drapes
  ];

  const selectedType = useMemo(
    () => types.find((t) => t.id === selectedTypeId) || null,
    [types, selectedTypeId],
  );

  const suggestedKeys = useMemo(() => {
    if (!selectedType) return [];
    return SUGGESTED_KEYS[selectedType.name] || ["notes"];
  }, [selectedType]);

  const loadAll = async () => {
    setError(null);
    const t = await fetchItemTypes();
    setTypes(t.item_types);

    // load items for all types (simple + OK for now)
    const next: Record<string, Item[]> = {};
    for (const type of t.item_types) {
      const r = await fetchItems(type.id);
      next[type.id] = r.items;
    }
    setItemsByType(next);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleType = (id: string) => {
    setExpandedTypes((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const startCreate = (typeId: string) => {
    setSelectedTypeId(typeId);
    setEditingItem(null);
    setFormName("");
    setFormUnit("");
    setFormAttrs({});
  };

  const startEdit = (item: Item) => {
    setSelectedTypeId(item.item_type_id);
    setEditingItem(item);
    setFormName(item.name);
    setFormUnit(item.default_unit);
    setFormAttrs(item.default_attributes || {});
  };

  const addSuggestedKey = (key: string) => {
    setFormAttrs((a) => (key in a ? a : { ...a, [key]: "" }));
  };

  const save = async () => {
    setError(null);

    if (!selectedTypeId) return setError("Pick a category first");
    if (!formName.trim()) return setError("Item name is required");
    if (!formUnit.trim()) return setError("Default unit is required");

    setSaving(true);
    try {
      if (editingItem) {
        const r = await updateItem(editingItem.id, {
          name: formName.trim(),
          default_unit: formUnit.trim(),
          default_attributes: formAttrs,
        });
        // refresh local cache
        setItemsByType((m) => {
          const list = m[selectedTypeId] || [];
          return {
            ...m,
            [selectedTypeId]: list.map((x) =>
              x.id === r.item.id ? r.item : x,
            ),
          };
        });
        setEditingItem(r.item);
      } else {
        const r = await createItem({
          item_type_id: selectedTypeId,
          name: formName.trim(),
          default_unit: formUnit.trim(),
          default_attributes: formAttrs,
        });
        setItemsByType((m) => ({
          ...m,
          [selectedTypeId]: [...(m[selectedTypeId] || []), r.item].sort(
            (a, b) => a.name.localeCompare(b.name),
          ),
        }));
        setEditingItem(r.item);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="item-page">
      <div className="item-header">
        <h1>Items</h1>
        <p>
          Manage item definitions and default attributes (used as suggestions
          when receiving inventory).
        </p>
      </div>

      <div className="item-grid">
        {/* LEFT: browse */}
        <div className="card">
          <div className="card-title">Browse by category</div>

          <div className="category-list">
            {types.map((t) => {
              const open = expandedTypes.has(t.id);
              const list = itemsByType[t.id] || [];

              return (
                <div key={t.id} className="category-block">
                  <div className="category-row">
                    <button className="toggle" onClick={() => toggleType(t.id)}>
                      {open ? "▾" : "▸"}
                    </button>

                    <button
                      className="category-name"
                      onClick={() => toggleType(t.id)}
                      title="Expand/collapse"
                    >
                      {t.name}
                      <span className="count">{list.length}</span>
                    </button>

                    <button
                      className="small-btn"
                      onClick={() => startCreate(t.id)}
                    >
                      + Add
                    </button>
                  </div>

                  {open && (
                    <div className="items-list">
                      {list.length === 0 ? (
                        <div className="muted">No items yet</div>
                      ) : (
                        list.map((it) => (
                          <button
                            key={it.id}
                            className={`item-row ${editingItem?.id === it.id ? "active" : ""}`}
                            onClick={() => startEdit(it)}
                          >
                            <div className="item-name">{it.name}</div>
                            <div className="item-unit">{it.default_unit}</div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: create/edit */}
        <div className="card">
          <div className="card-title">
            {editingItem ? "Edit item" : "Create new item"}
          </div>

          {error && <div className="error">{error}</div>}

          <div className="form">
            <label>Category</label>
            <select
              value={selectedTypeId}
              onChange={(e) => {
                setSelectedTypeId(e.target.value);
                setEditingItem(null);
                setFormName("");
                setFormUnit("");
                setFormAttrs({});
              }}
            >
              <option value="">Select category</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>

            <label>Item name</label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g. Amlodipine"
            />

            <label>Default unit</label>
            <select
              value={formUnit}
              onChange={(e) => setFormUnit(e.target.value)}
            >
              <option value="">Select unit</option>
              {ALLOWED_UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>

            <div className="suggested">
              <div className="suggested-title">Suggested fields (optional)</div>
              <div className="chips">
                {suggestedKeys.map((k) => (
                  <button
                    key={k}
                    className="chip"
                    type="button"
                    onClick={() => addSuggestedKey(k)}
                  >
                    + {k}
                  </button>
                ))}
              </div>
            </div>

            <label>Default attributes (optional)</label>
            <AttributesEditor value={formAttrs} onChange={setFormAttrs} />

            <button className="primary" onClick={save} disabled={saving}>
              {saving
                ? "Saving…"
                : editingItem
                  ? "Save changes"
                  : "Create item"}
            </button>

            <div className="note">
              Defaults are suggestions only. Editing defaults won't change
              existing inventory lots.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
