import { apiFetch } from "./client";

export type CatalogCategory = {
  id: string;
  name: string;
  path: string[];
};

export type CatalogTag = {
  id: string;
  name: string;
  code: string | null;
};

export type CatalogAttributeDefinition = {
  id?: string;
  item_id?: string;
  attribute_key: string;
  label: string;
  data_type: "text" | "number" | "date" | "boolean" | "enum";
  is_required: boolean;
  allowed_values?: unknown[];
  sort_order?: number;
};

export type CatalogItem = {
  id: string;
  name: string;
  description: string | null;
  default_unit: string;
  is_internal_only: boolean;
  is_active: boolean;
  category: {
    id: string;
    name: string;
    path: string[];
  } | null;
  tags: CatalogTag[];
  attribute_definitions: CatalogAttributeDefinition[];
};

export async function fetchCatalogItems(params?: {
  q?: string;
  include_inactive?: boolean;
  include_internal?: boolean;
}): Promise<{ items: CatalogItem[] }> {
  const query = new URLSearchParams();

  if (params?.q) query.set("q", params.q);
  if (params?.include_inactive !== undefined) {
    query.set("include_inactive", String(params.include_inactive));
  }
  if (params?.include_internal !== undefined) {
    query.set("include_internal", String(params.include_internal));
  }

  const qs = query.toString();
  return apiFetch(`/v2/item-catalog/items${qs ? `?${qs}` : ""}`);
}

export async function getCatalogItem(id: string): Promise<{ item: CatalogItem }> {
  return apiFetch(`/v2/item-catalog/items/${id}`);
}

export async function fetchCatalogCategories(): Promise<{ categories: CatalogCategory[] }> {
  return apiFetch(`/v2/item-catalog/categories`);
}

export async function fetchCatalogTags(): Promise<{ tags: CatalogTag[] }> {
  return apiFetch(`/v2/item-catalog/tags`);
}

export async function createCatalogItem(body: {
  name: string;
  description?: string | null;
  default_unit: string;
  category_id?: string | null;
  is_internal_only: boolean;
  is_active: boolean;
  tag_ids: string[];
  attribute_definitions: CatalogAttributeDefinition[];
}) {
  return apiFetch(`/v2/item-catalog/items`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCatalogItem(
  id: string,
  body: {
    name?: string;
    description?: string | null;
    default_unit?: string;
    category_id?: string | null;
    is_internal_only?: boolean;
    is_active?: boolean;
    tag_ids?: string[];
    attribute_definitions?: CatalogAttributeDefinition[];
  },
) {
  return apiFetch(`/v2/item-catalog/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}