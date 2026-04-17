import { useEffect, useMemo, useState } from "react";
import {
  createCatalogItem,
  fetchCatalogCategories,
  fetchCatalogItems,
  fetchCatalogTags,
  getCatalogItem,
  updateCatalogItem,
  //   type CatalogAttributeDefinition,
  type CatalogCategory,
  type CatalogItem,
  type CatalogTag,
} from "../../api/itemCatalog";
import ImageUploadPanel from "../../components/ImageUploadPanel";
import styles from "./ItemCatalogPage.module.css";

type ItemFormState = {
  name: string;
  description: string;
  default_unit: string;
  category_id: string;
  is_internal_only: boolean;
  is_active: boolean;
  tag_ids: string[];
  attribute_definitions: CatalogAttributeDefinitionForm[];
};

type CatalogAttributeDefinitionForm = {
  attribute_key: string;
  label: string;
  data_type: "text" | "number" | "date" | "boolean" | "enum";
  is_required: boolean;
  allowed_values_text: string;
  sort_order: number;
};

function emptyAttribute(): CatalogAttributeDefinitionForm {
  return {
    attribute_key: "",
    label: "",
    data_type: "text",
    is_required: false,
    allowed_values_text: "",
    sort_order: 0,
  };
}

function buildFormFromItem(item: CatalogItem): ItemFormState {
  return {
    name: item.name || "",
    description: item.description || "",
    default_unit: item.default_unit || "",
    category_id: item.category?.id || "",
    is_internal_only: !!item.is_internal_only,
    is_active: !!item.is_active,
    tag_ids: item.tags.map((t) => t.id),
    attribute_definitions: (item.attribute_definitions || []).map((attr) => ({
      attribute_key: attr.attribute_key,
      label: attr.label,
      data_type: attr.data_type,
      is_required: !!attr.is_required,
      allowed_values_text: Array.isArray(attr.allowed_values)
        ? JSON.stringify(attr.allowed_values)
        : "[]",
      sort_order: attr.sort_order || 0,
    })),
  };
}

function emptyForm(): ItemFormState {
  return {
    name: "",
    description: "",
    default_unit: "",
    category_id: "",
    is_internal_only: false,
    is_active: true,
    tag_ids: [],
    attribute_definitions: [],
  };
}

export default function ItemCatalogPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [tags, setTags] = useState<CatalogTag[]>([]);

  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);
  const [includeInternal, setIncludeInternal] = useState(true);

  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ItemFormState>(emptyForm());

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [itemsRes, categoriesRes, tagsRes] = await Promise.all([
        fetchCatalogItems({
          q: search || undefined,
          include_inactive: includeInactive,
          include_internal: includeInternal,
        }),
        fetchCatalogCategories(),
        fetchCatalogTags(),
      ]);

      setItems(itemsRes.items);
      setCategories(categoriesRes.categories);
      setTags(tagsRes.tags);
    } catch (err: any) {
      setError(err?.message || "Failed to load item catalog");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [search, includeInactive, includeInternal]);

  async function openCreate() {
    setEditingItemId(null);
    setForm(emptyForm());
    setShowCreate(true);
  }

  async function openEdit(itemId: string) {
    try {
      setError(null);
      const res = await getCatalogItem(itemId);
      setEditingItemId(itemId);
      setForm(buildFormFromItem(res.item));
      setShowCreate(true);
      window.scrollTo({top: 0, behavior: "smooth"})
    } catch (err: any) {
      setError(err?.message || "Failed to load item");
    }
  }

  function closeForm() {
    setEditingItemId(null);
    setShowCreate(false);
    setForm(emptyForm());
  }

  function setField<K extends keyof ItemFormState>(
    key: K,
    value: ItemFormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function toggleTag(tagId: string) {
    setForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId)
        ? prev.tag_ids.filter((id) => id !== tagId)
        : [...prev.tag_ids, tagId],
    }));
  }

  function addAttribute() {
    setForm((prev) => ({
      ...prev,
      attribute_definitions: [...prev.attribute_definitions, emptyAttribute()],
    }));
  }

  function removeAttribute(index: number) {
    setForm((prev) => ({
      ...prev,
      attribute_definitions: prev.attribute_definitions.filter(
        (_, i) => i !== index,
      ),
    }));
  }

  function updateAttribute(
    index: number,
    field: keyof CatalogAttributeDefinitionForm,
    value: any,
  ) {
    setForm((prev) => ({
      ...prev,
      attribute_definitions: prev.attribute_definitions.map((attr, i) =>
        i === index ? { ...attr, [field]: value } : attr,
      ),
    }));
  }

  const normalizedPayload = useMemo(() => {
    const attribute_definitions = form.attribute_definitions
      .filter((attr) => attr.attribute_key.trim() && attr.label.trim())
      .map((attr) => {
        let allowed_values: unknown[] = [];
        try {
          allowed_values = attr.allowed_values_text.trim()
            ? JSON.parse(attr.allowed_values_text)
            : [];
          if (!Array.isArray(allowed_values)) {
            allowed_values = [];
          }
        } catch {
          allowed_values = [];
        }

        return {
          attribute_key: attr.attribute_key.trim(),
          label: attr.label.trim(),
          data_type: attr.data_type,
          is_required: attr.is_required,
          allowed_values,
          sort_order: Number(attr.sort_order || 0),
        };
      });

    return {
      name: form.name.trim(),
      description: form.description.trim() || null,
      default_unit: form.default_unit.trim(),
      category_id: form.category_id || null,
      is_internal_only: form.is_internal_only,
      is_active: form.is_active,
      tag_ids: form.tag_ids,
      attribute_definitions,
    };
  }, [form]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!normalizedPayload.name || !normalizedPayload.default_unit) {
      setError("Name and default unit are required.");
      return;
    }

    try {
      setSaving(true);

      if (editingItemId) {
        await updateCatalogItem(editingItemId, normalizedPayload);
      } else {
        await createCatalogItem(normalizedPayload);
      }

      closeForm();
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Item Catalog</h1>
          <p className={styles.subtitle}>
            Manage item definitions, tags, categories, and required lot
            attributes.
          </p>
        </div>

        <button className="app-button" onClick={openCreate}>
          New Item
        </button>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}

      <div className={styles.filters}>
        <div className="filter-group search">
          <label>Search</label>
          <input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onBlur={() => setSearch(searchDraft.trim())}
            onKeyDown={(e) => {
              if (e.key === "Enter") setSearch(searchDraft.trim());
            }}
            placeholder="Search items..."
          />
        </div>

        <div className="filter-group small">
          <label>Visibility</label>
          <label className="shipment-toggle">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
            />
            <span>Include inactive</span>
          </label>

          <label className="shipment-toggle">
            <input
              type="checkbox"
              checked={includeInternal}
              onChange={(e) => setIncludeInternal(e.target.checked)}
            />
            <span>Include internal-only</span>
          </label>
        </div>
      </div>

      {showCreate && (
        <section className="panel" id="edit-create-item">
          <div className="panel-header">
            <h2>{editingItemId ? "Edit Item" : "Create Item"}</h2>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className="my-profile-grid">
              <div className="form-group">
                <label>Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Default Unit</label>
                <input
                  value={form.default_unit}
                  onChange={(e) => setField("default_unit", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group span-2">
                <label>Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={form.category_id}
                  onChange={(e) => setField("category_id", e.target.value)}
                  disabled={saving}
                >
                  <option value="">No category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.path.join(" / ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Flags</label>
                <div className={styles.tagGrid}>
                  <label className="shipment-toggle">
                    <input
                      type="checkbox"
                      checked={form.is_internal_only}
                      onChange={(e) =>
                        setField("is_internal_only", e.target.checked)
                      }
                      disabled={saving}
                    />
                    <span>Internal only</span>
                  </label>

                  <label className="shipment-toggle">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setField("is_active", e.target.checked)}
                      disabled={saving}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="form-group span-2">
                <label>Tags</label>
                <div className={styles.tagGrid}>
                  {tags.map((tag) => (
                    <label key={tag.id} className="inventory-tag-filter">
                      <input
                        type="checkbox"
                        checked={form.tag_ids.includes(tag.id)}
                        onChange={() => toggleTag(tag.id)}
                        disabled={saving}
                      />
                      <span>{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className={styles.attributeEditor}>
              <div className="panel-header">
                <h3>Attribute Definitions</h3>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={addAttribute}
                >
                  Add Attribute
                </button>
              </div>

              {form.attribute_definitions.length === 0 ? (
                <div className="dashboard-empty">No attributes defined.</div>
              ) : (
                <div className={styles.attributeStack}>
                  {form.attribute_definitions.map((attr, index) => (
                    <div key={index} className={styles.attributeCard}>
                      <div className="my-profile-grid">
                        <div className="form-group">
                          <label>Attribute Key</label>
                          <input
                            value={attr.attribute_key}
                            onChange={(e) =>
                              updateAttribute(
                                index,
                                "attribute_key",
                                e.target.value,
                              )
                            }
                            disabled={saving}
                            placeholder="expiration_date"
                          />
                        </div>

                        <div className="form-group">
                          <label>Label</label>
                          <input
                            value={attr.label}
                            onChange={(e) =>
                              updateAttribute(index, "label", e.target.value)
                            }
                            disabled={saving}
                          />
                        </div>

                        <div className="form-group">
                          <label>Data Type</label>
                          <select
                            value={attr.data_type}
                            onChange={(e) =>
                              updateAttribute(
                                index,
                                "data_type",
                                e.target.value,
                              )
                            }
                            disabled={saving}
                          >
                            <option value="text">text</option>
                            <option value="number">number</option>
                            <option value="date">date</option>
                            <option value="boolean">boolean</option>
                            <option value="enum">enum</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Sort Order</label>
                          <input
                            type="number"
                            value={attr.sort_order}
                            onChange={(e) =>
                              updateAttribute(
                                index,
                                "sort_order",
                                Number(e.target.value),
                              )
                            }
                            disabled={saving}
                          />
                        </div>

                        <div className="form-group span-2">
                          <label>Allowed Values (JSON array)</label>
                          <input
                            value={attr.allowed_values_text}
                            onChange={(e) =>
                              updateAttribute(
                                index,
                                "allowed_values_text",
                                e.target.value,
                              )
                            }
                            disabled={saving}
                            placeholder='["S","M","L"]'
                          />
                        </div>

                        <div className="form-group small">
                          <label>Flags</label>
                          <label className="shipment-toggle">
                            <input
                              type="checkbox"
                              checked={attr.is_required}
                              onChange={(e) =>
                                updateAttribute(
                                  index,
                                  "is_required",
                                  e.target.checked,
                                )
                              }
                              disabled={saving}
                            />
                            <span>Required</span>
                          </label>
                        </div>
                      </div>

                      <div className="form-actions">
                        <button
                          type="button"
                          className="secondary-button danger"
                          onClick={() => removeAttribute(index)}
                        >
                          Remove Attribute
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editingItemId && (
                <div className="form-group span-2">
                  <ImageUploadPanel
                    mode="item"
                    entityId={editingItemId}
                    title="Default Item Images"
                  />
                </div>
              )}
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
                  : editingItemId
                    ? "Save Changes"
                    : "Create Item"}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="panel-header">
          <h2>Items</h2>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner" />
            <span>Loading items…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="dashboard-empty">No items found.</div>
        ) : (
          <table className="meta-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Default Unit</th>
                <th>Tags</th>
                <th>Flags</th>
                <th>Attributes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <strong>{item.name}</strong>
                      {item.description && (
                        <div className="muted">{item.description}</div>
                      )}
                    </div>
                  </td>

                  <td>{item.category?.path?.join(" / ") || "—"}</td>
                  <td>{item.default_unit}</td>

                  <td>
                    <div className="inventory-tag-list">
                      {item.tags.length === 0 ? (
                        <span className="muted">—</span>
                      ) : (
                        item.tags.map((tag) => (
                          <span key={tag.id} className="inventory-tag-chip">
                            {tag.name}
                          </span>
                        ))
                      )}
                    </div>
                  </td>

                  <td>
                    <div className="muted">
                      <div>
                        Internal: {item.is_internal_only ? "Yes" : "No"}
                      </div>
                      <div>Active: {item.is_active ? "Yes" : "No"}</div>
                    </div>
                  </td>

                  <td>{item.attribute_definitions?.length || 0}</td>

                  <td>
                    <button
                      className="secondary-button"
                      onClick={() => {
                        openEdit(item.id);
                      }}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
