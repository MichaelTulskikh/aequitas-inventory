import { apiFetch } from "./client";

export type InventoryCatalogLot = {
  inventory_lot_id: string;
  location_id: string;
  location_name: string;
  location_path: string[];
  attributes: Record<string, unknown>;
  available_quantity: number;
  on_hand_quantity?: number;
  reserved_quantity?: number;
  lot_image_url: string | null;
  item_image_url: string | null;
  received_at: string | null;
  status: string;
};

export type InventoryCatalogItem = {
  item_id: string;
  item_name: string;
  item_description: string | null;
  default_unit: string;
  category: {
    id: string;
    name: string;
    path: string[];
  } | null;
  tags: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
  primary_image_url: string | null;
  total_available_quantity: number;
  lot_count: number;
  is_internal_only?: boolean;
  lots: InventoryCatalogLot[];
};

export type InventoryCatalogResponse = {
  items: InventoryCatalogItem[];
  page: number;
  page_size: number;
  total: number;
};

export type InventoryCatalogQuery = {
  q?: string;
  category_id?: string;
  tag_ids?: string[];
  pallet_numbers?: number[];
  box_numbers?: number[];
  page?: number;
  page_size?: number;
  only_available?: boolean;
  include_internal?: boolean;
};

export type InventoryItem = {
  id: string;
  name: string;
  description: string | null;
  default_unit: string;
  is_internal_only: boolean;
  category: {
    id: string;
    name: string;
    path: string[];
  } | null;
};

export type InventoryItemsResponse = {
  items: InventoryItem[];
  page: number;
  page_size: number;
  total: number;
};

export type FetchInventoryItemsQuery = {
  q?: string;
  include_internal?: boolean;
};

export type InventoryLotAttributeDefinition = {
  id: string;
  attribute_key: string;
  label: string;
  data_type: string;
  is_required: boolean;
  allowed_values: unknown[] | null; // adjust if you know the exact shape
  sort_order: number;
};

export type InventoryLotDetail = {
  inventory_lot_id: string;
  item_id: string;
  item_name: string;
  item_description: string | null;
  default_unit: string;
  location_id: string;
  location_name: string;
  location_path: string[];
  quantity_on_hand?: number;
  quantity_reserved?: number;
  available_quantity: number;
  attributes: Record<string, unknown>;
  status: string;
  received_at: string | null;
  source_note: string | null;
  inbound_shipment_id: string | null;
  inbound_shipment_number: string | null;
  inbound_shipment_reference: string | null;
  inbound_occurred_at: string | null;
  attribute_definitions: InventoryLotAttributeDefinition[];
  is_internal_only: boolean;
  // images?: Array<{
  //   id: string;
  //   caption: string | null;
  //   is_primary: boolean;
  //   created_at: string;
  //   url: string | null;
  // }>;
};

export async function fetchInventoryCatalog(
  params: InventoryCatalogQuery = {},
): Promise<InventoryCatalogResponse> {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.category_id) query.set("category_id", params.category_id);
  if (params.page) query.set("page", String(params.page));
  if (params.page_size) query.set("page_size", String(params.page_size));
  if (params.only_available !== undefined) {
    query.set("only_available", String(params.only_available));
  }
  if (params.include_internal !== undefined) {
    query.set("include_internal", String(params.include_internal));
  }

  for (const tagId of params.tag_ids || []) {
    query.append("tag_ids", tagId);
  }

  if (params.pallet_numbers?.length) {
    query.set("pallet_numbers", params.pallet_numbers.join(","));
  }

  if (params.box_numbers?.length) {
    query.set("box_numbers", params.box_numbers.join(","));
  }

  const res = await apiFetch(`/v2/inventory/catalog?${query.toString()}`);

  return res;
}

export async function fetchInventoryCategories(): Promise<{
  categories: Array<{
    id: string;
    name: string;
    path: string[];
  }>;
}> {
  const res = await apiFetch(`/v2/inventory/categories`);

  return res;
}

export async function fetchInventoryTags(): Promise<{
  tags: Array<{
    id: string;
    name: string;
    code: string | null;
  }>;
}> {
  const res = await apiFetch(`/v2/inventory/tags`);

  return res;
}

export async function fetchInventoryItems(
  params: FetchInventoryItemsQuery = {},
): Promise<{ items: InventoryItem[] }> {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.include_internal !== undefined) {
    query.set("include_internal", String(params.include_internal));
  }

  const qs = query.toString();
  return apiFetch(`/v2/inventory/items${qs ? `?${qs}` : ""}`);
}

export async function fetchInventoryItemAttributeDefinitions(
  itemId: string,
): Promise<{
  attributes: Array<{
    id: string;
    item_id: string;
    attribute_key: string;
    label: string;
    data_type: "text" | "number" | "date" | "boolean" | "enum";
    is_required: boolean;
    allowed_values?: unknown[];
    sort_order?: number;
  }>;
}> {
  return apiFetch(`/v2/inventory/items/${itemId}/attribute-definitions`);
}

export async function fetchInventoryLocationsTree(): Promise<{
  locations: Array<{
    id: string;
    parent_location_id?: string | null;
    name: string;
    code?: string | null;
    type: string;
    is_active?: boolean;
    path: string[];
  }>;
}> {
  return apiFetch(`/v2/inventory/locations/tree`);
}

export async function relocateInventoryLot(
  id: string,
  body: {
    to_location_id: string;
    reason?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{
  ok: boolean;
  transaction: unknown;
}> {
  return apiFetch(`/v2/inventory/lots/${id}/relocate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function receiveInventory(body: {
  item_id: string;
  location_id: string;
  quantity: number;
  attributes?: Record<string, unknown>;
  reason?: string;
  received_at?: string;
  source_note?: string;
  status?: string;
  inbound_shipment_id?: string;
}) {
  return apiFetch(`/v2/inventory/receive`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchInventoryLot(
  id: string,
): Promise<{ lot: InventoryLotDetail }> {
  return apiFetch(`/v2/inventory/lots/${id}`);
}

export async function adjustInventoryLot(
  id: string,
  body: {
    delta: number;
    reason: string;
    metadata?: Record<string, unknown>;
  },
): Promise<{
  ok: boolean;
  transaction: unknown;
}> {
  return apiFetch(`/v2/inventory/lots/${id}/adjust`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateInventoryLotAttributes(
  lotId: string,
  body: {
    attributes: Record<string, unknown>;
  },
) {
  return apiFetch(`/v2/inventory/lots/${lotId}/attributes`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
