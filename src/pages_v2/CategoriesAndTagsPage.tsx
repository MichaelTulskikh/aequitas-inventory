import { useEffect, useMemo, useState } from "react";
import {
  createCategory,
  createTag,
  fetchCategories,
  fetchTags,
  updateCategory,
  updateTag,
  type AdminCategory,
  type AdminTag,
} from "../api/catalogMeta";
import "../styles_new/categories-tags.css";

type CategoryForm = {
  name: string;
  code: string;
  parent_category_id: string;
  sort_order: number;
  is_active: boolean;
};

type TagForm = {
  name: string;
  code: string;
};

type CategoryTreeNode = AdminCategory & {
  children: CategoryTreeNode[];
  depth: number;
};

function emptyCategoryForm(): CategoryForm {
  return {
    name: "",
    code: "",
    parent_category_id: "",
    sort_order: 0,
    is_active: true,
  };
}

function emptyTagForm(): TagForm {
  return {
    name: "",
    code: "",
  };
}

function buildCategoryTree(categories: AdminCategory[]): CategoryTreeNode[] {
  const map = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    map.set(category.id, {
      ...category,
      children: [],
      depth: 0,
    });
  }

  const roots: CategoryTreeNode[] = [];

  for (const node of map.values()) {
    if (node.parent_category_id && map.has(node.parent_category_id)) {
      map.get(node.parent_category_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  function sortNodes(nodes: CategoryTreeNode[], depth: number) {
    nodes.sort((a, b) => {
      const bySort = (a.sort_order ?? 0) - (b.sort_order ?? 0);
      if (bySort !== 0) return bySort;
      return a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    for (const node of nodes) {
      node.depth = depth;
      sortNodes(node.children, depth + 1);
    }
  }

  sortNodes(roots, 0);
  return roots;
}

function flattenTree(nodes: CategoryTreeNode[]): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];

  function visit(node: CategoryTreeNode) {
    result.push(node);
    for (const child of node.children) {
      visit(child);
    }
  }

  for (const node of nodes) {
    visit(node);
  }

  return result;
}

function isDescendantOf(
  categories: AdminCategory[],
  maybeDescendantId: string,
  ancestorId: string,
): boolean {
  const byId = new Map(categories.map((c) => [c.id, c]));

  let current = byId.get(maybeDescendantId);
  while (current?.parent_category_id) {
    if (current.parent_category_id === ancestorId) return true;
    current = byId.get(current.parent_category_id);
  }

  return false;
}

function categoryLabel(node: { name: string; depth: number }) {
  return `${"— ".repeat(node.depth)}${node.name}`;
}

function collectExpandableIds(nodes: CategoryTreeNode[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};

  function visit(node: CategoryTreeNode) {
    if (node.children.length > 0) {
      result[node.id] = false;
    }
    for (const child of node.children) {
      visit(child);
    }
  }

  for (const node of nodes) {
    visit(node);
  }

  return result;
}

export default function CategoriesAndTagsPage() {
  const [loading, setLoading] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingTag, setSavingTag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [tags, setTags] = useState<AdminTag[]>([]);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);

  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);

  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategoryForm());
  const [tagForm, setTagForm] = useState<TagForm>(emptyTagForm());

  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({});

  async function load() {
    try {
      setLoading(true);
      setError(null);

      const [categoriesRes, tagsRes] = await Promise.all([
        fetchCategories(),
        fetchTags(),
      ]);

      const nextCategories = categoriesRes.categories || [];
      const nextTags = tagsRes.tags || [];

      setCategories(nextCategories);
      setTags(nextTags);

      const tree = buildCategoryTree(nextCategories);
      const defaultExpanded = collectExpandableIds(tree);

      setExpandedCategoryIds((prev) => {
        const next = { ...defaultExpanded };

        for (const id of Object.keys(defaultExpanded)) {
          if (prev[id] !== undefined) {
            next[id] = prev[id];
          }
        }

        return next;
      });
    } catch (err: any) {
      setError(err?.message || "Failed to load categories and tags");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const flatCategories = useMemo(() => flattenTree(categoryTree), [categoryTree]);

  const categoryOptions = useMemo(() => {
    return flatCategories.filter((cat) => {
      if (!editingCategoryId) return true;
      if (cat.id === editingCategoryId) return false;
      if (isDescendantOf(categories, cat.id, editingCategoryId)) return false;
      return true;
    });
  }, [flatCategories, categories, editingCategoryId]);

  function openCreateCategory() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm());
    setShowCategoryForm(true);
  }

  function openEditCategory(category: AdminCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name || "",
      code: category.code || "",
      parent_category_id: category.parent_category_id || "",
      sort_order: category.sort_order || 0,
      is_active: category.is_active ?? true,
    });
    setShowCategoryForm(true);
  }

  function closeCategoryForm() {
    setEditingCategoryId(null);
    setCategoryForm(emptyCategoryForm());
    setShowCategoryForm(false);
  }

  function openCreateTag() {
    setEditingTagId(null);
    setTagForm(emptyTagForm());
    setShowTagForm(true);
  }

  function openEditTag(tag: AdminTag) {
    setEditingTagId(tag.id);
    setTagForm({
      name: tag.name || "",
      code: tag.code || "",
    });
    setShowTagForm(true);
  }

  function closeTagForm() {
    setEditingTagId(null);
    setTagForm(emptyTagForm());
    setShowTagForm(false);
  }

  function toggleCategoryExpanded(id: string) {
    setExpandedCategoryIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  function expandAllCategories() {
    const next: Record<string, boolean> = {};

    function visit(node: CategoryTreeNode) {
      if (node.children.length > 0) {
        next[node.id] = true;
      }
      for (const child of node.children) {
        visit(child);
      }
    }

    for (const root of categoryTree) {
      visit(root);
    }

    setExpandedCategoryIds(next);
  }

  function collapseAllCategories() {
    const next: Record<string, boolean> = {};

    function visit(node: CategoryTreeNode) {
      if (node.children.length > 0) {
        next[node.id] = false;
      }
      for (const child of node.children) {
        visit(child);
      }
    }

    for (const root of categoryTree) {
      visit(root);
    }

    setExpandedCategoryIds(next);
  }

  async function handleSaveCategory(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!categoryForm.name.trim()) {
      setError("Category name is required.");
      return;
    }

    try {
      setSavingCategory(true);

      const payload = {
        name: categoryForm.name.trim(),
        code: categoryForm.code.trim() || null,
        parent_category_id: categoryForm.parent_category_id || null,
        sort_order: Number(categoryForm.sort_order || 0),
        is_active: categoryForm.is_active,
      };

      if (editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
      } else {
        await createCategory(payload);
      }

      closeCategoryForm();
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save category");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleSaveTag(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!tagForm.name.trim()) {
      setError("Tag name is required.");
      return;
    }

    try {
      setSavingTag(true);

      const payload = {
        name: tagForm.name.trim(),
        code: tagForm.code.trim() || null,
      };

      if (editingTagId) {
        await updateTag(editingTagId, payload);
      } else {
        await createTag(payload);
      }

      closeTagForm();
      await load();
    } catch (err: any) {
      setError(err?.message || "Failed to save tag");
    } finally {
      setSavingTag(false);
    }
  }

  function renderCategoryNode(node: CategoryTreeNode): React.ReactNode {
    const hasChildren = node.children.length > 0;
    const expanded = expandedCategoryIds[node.id] ?? false;

    return (
      <div key={node.id} className="ctg-page__tree-node">
        <div
          className="ctg-page__tree-row"
          style={{ paddingLeft: `${12 + node.depth * 22}px` }}
        >
          <button
            type="button"
            className="ctg-page__tree-expander"
            onClick={() => hasChildren && toggleCategoryExpanded(node.id)}
            disabled={!hasChildren}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {hasChildren ? (expanded ? "▾" : "▸") : "•"}
          </button>

          <div className="ctg-page__tree-main">
            <div className="ctg-page__tree-title-row">
              <div className="ctg-page__tree-name">{node.name}</div>

              <span className="ctg-page__tree-code">
                {node.code || "—"}
              </span>

              <span
                className={`ctg-page__status-chip ${
                  node.is_active ? "is-active" : "is-inactive"
                }`}
              >
                {node.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="ctg-page__tree-meta">
              <span>
                <strong>Sort:</strong> {node.sort_order ?? 0}
              </span>

              <span>
                <strong>Parent:</strong>{" "}
                {node.parent_category_id
                  ? categories.find((c) => c.id === node.parent_category_id)?.name || "—"
                  : "Root"}
              </span>
            </div>
          </div>

          <div className="ctg-page__tree-actions">
            <button
              className="secondary-button"
              onClick={() => openEditCategory(node)}
              type="button"
            >
              Edit
            </button>
          </div>
        </div>

        {hasChildren && expanded && (
          <div className="ctg-page__tree-children">
            {node.children.map((child) => renderCategoryNode(child))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="ctg-page">
      <div className="ctg-page__header">
        <div>
          <h1 className="ctg-page__title">Categories & Tags</h1>
          <p className="ctg-page__subtitle">
            Manage category hierarchy and item tags.
          </p>
        </div>
      </div>

      {error && <div className="dashboard-error">Error: {error}</div>}

      <div className="ctg-page__grid">
        <section className="ctg-page__panel">
          <div className="ctg-page__panel-header">
            <h2>Categories</h2>

            <div className="ctg-page__panel-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={expandAllCategories}
                disabled={loading || categories.length === 0}
              >
                Expand All
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={collapseAllCategories}
                disabled={loading || categories.length === 0}
              >
                Collapse All
              </button>

              <button className="app-button" onClick={openCreateCategory} type="button">
                New Category
              </button>
            </div>
          </div>

          {showCategoryForm && (
            <form className="ctg-page__form" onSubmit={handleSaveCategory}>
              <div className="ctg-page__form-grid">
                <div className="ctg-page__form-group">
                  <label>Name</label>
                  <input
                    value={categoryForm.name}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={savingCategory}
                  />
                </div>

                <div className="ctg-page__form-group">
                  <label>Code</label>
                  <input
                    value={categoryForm.code}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({ ...prev, code: e.target.value }))
                    }
                    disabled={savingCategory}
                  />
                </div>

                <div className="ctg-page__form-group">
                  <label>Parent Category</label>
                  <select
                    value={categoryForm.parent_category_id}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        parent_category_id: e.target.value,
                      }))
                    }
                    disabled={savingCategory}
                  >
                    <option value="">No parent</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {categoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="ctg-page__form-group">
                  <label>Sort Order</label>
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) =>
                      setCategoryForm((prev) => ({
                        ...prev,
                        sort_order: Number(e.target.value),
                      }))
                    }
                    disabled={savingCategory}
                  />
                </div>

                <div className="ctg-page__form-group ctg-page__form-group--small">
                  <label>Flags</label>
                  <label className="ctg-page__toggle">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({
                          ...prev,
                          is_active: e.target.checked,
                        }))
                      }
                      disabled={savingCategory}
                    />
                    <span>Active</span>
                  </label>
                </div>
              </div>

              <div className="ctg-page__form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeCategoryForm}
                  disabled={savingCategory}
                >
                  Cancel
                </button>

                <button type="submit" className="app-button" disabled={savingCategory}>
                  {savingCategory
                    ? "Saving..."
                    : editingCategoryId
                      ? "Save Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="dashboard-loading">
              <div className="spinner" />
              <span>Loading categories…</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="dashboard-empty">No categories found.</div>
          ) : (
            <div className="ctg-page__tree">
              {categoryTree.map((node) => renderCategoryNode(node))}
            </div>
          )}
        </section>

        <section className="ctg-page__panel">
          <div className="ctg-page__panel-header">
            <h2>Tags</h2>

            <div className="ctg-page__panel-actions">
              <button className="app-button" onClick={openCreateTag} type="button">
                New Tag
              </button>
            </div>
          </div>

          {showTagForm && (
            <form className="ctg-page__form" onSubmit={handleSaveTag}>
              <div className="ctg-page__form-grid">
                <div className="ctg-page__form-group">
                  <label>Name</label>
                  <input
                    value={tagForm.name}
                    onChange={(e) =>
                      setTagForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    disabled={savingTag}
                  />
                </div>

                <div className="ctg-page__form-group">
                  <label>Code</label>
                  <input
                    value={tagForm.code}
                    onChange={(e) =>
                      setTagForm((prev) => ({ ...prev, code: e.target.value }))
                    }
                    disabled={savingTag}
                  />
                </div>
              </div>

              <div className="ctg-page__form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeTagForm}
                  disabled={savingTag}
                >
                  Cancel
                </button>

                <button type="submit" className="app-button" disabled={savingTag}>
                  {savingTag
                    ? "Saving..."
                    : editingTagId
                      ? "Save Tag"
                      : "Create Tag"}
                </button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="dashboard-loading">
              <div className="spinner" />
              <span>Loading tags…</span>
            </div>
          ) : tags.length === 0 ? (
            <div className="dashboard-empty">No tags found.</div>
          ) : (
            <div className="ctg-page__table-wrap">
              <table className="ctg-page__table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th className="ctg-page__actions-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((tag) => (
                    <tr key={tag.id}>
                      <td>{tag.name}</td>
                      <td>{tag.code || "—"}</td>
                      <td>
                        <div className="ctg-page__table-actions">
                          <button
                            className="secondary-button"
                            onClick={() => openEditTag(tag)}
                            type="button"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}