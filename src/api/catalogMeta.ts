import { apiFetch } from "./client";

export type AdminCategory = {
  id: string;
  parent_category_id: string | null;
  name: string;
  code: string | null;
  sort_order: number;
  is_active: boolean;
  path: string[];
};

export type AdminTag = {
  id: string;
  name: string;
  code: string | null;
};

export async function fetchCategories(): Promise<{ categories: AdminCategory[] }> {
  return apiFetch(`/v2/catalog-meta/categories`);
}

export async function fetchTags(): Promise<{ tags: AdminTag[] }> {
  return apiFetch(`/v2/catalog-meta/tags`);
}

export async function createCategory(body: {
  name: string;
  code?: string | null;
  parent_category_id?: string | null;
  sort_order?: number;
  is_active?: boolean;
}) {
  return apiFetch(`/v2/catalog-meta/categories`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCategory(
  id: string,
  body: {
    name?: string;
    code?: string | null;
    parent_category_id?: string | null;
    sort_order?: number;
    is_active?: boolean;
  },
) {
  return apiFetch(`/v2/catalog-meta/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function createTag(body: {
  name: string;
  code?: string | null;
}) {
  return apiFetch(`/v2/catalog-meta/tags`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateTag(
  id: string,
  body: {
    name?: string;
    code?: string | null;
  },
) {
  return apiFetch(`/v2/catalog-meta/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}