// src/api/items.ts
import { apiFetch } from "./client";

export type Item = {
  id: string;
  name: string;
  item_type_id: string;
  default_unit: string;
  default_attributes: Record<string, any>;
  is_active?: boolean;
};

export type ItemType = {
    id: string;
    name: string;
    code?: string | null;
}

export type ItemTypesResponse = {
    item_types: ItemType[];
}

export async function fetchItems(item_type_id?: string): Promise<{ items: Item[] }> {
  const q = item_type_id ? `?item_type_id=${encodeURIComponent(item_type_id)}` : "";
  return apiFetch(`/items${q}`);
}

export async function createItem(payload: {
  item_type_id: string;
  name: string;
  default_unit: string;
  default_attributes?: Record<string, any>;
}): Promise<{ item: Item }> {
  return apiFetch("/items", { method: "POST", body: JSON.stringify(payload) });
}

export async function fetchItemTypes(): Promise<ItemTypesResponse> {
    return apiFetch("/item-types")
}

export async function createItemType(input: {
  name: string;
  code?: string;
}) {
  return apiFetch("/item-types", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateItem(id: string, payload: Partial<{
  name: string;
  default_unit: string;
  default_attributes: Record<string, any>;
  is_active: boolean;
}>): Promise<{ item: Item }> {
  return apiFetch(`/items/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}