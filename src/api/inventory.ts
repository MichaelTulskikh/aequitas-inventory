import { apiFetch } from "./client";
import type {
  IAdjustInventoryLotInput,
  IAdjustInventoryLotResponse,
  IFetchInventoryItemsQuery,
  IInventoryAttributeDefinitionsResponse,
  IInventoryCatalogItem,
  IInventoryCatalogQuery,
  IInventoryCatalogResponse,
  IInventoryItemsResponse,
  IInventoryLocationsTreeResponse,
  IInventoryLotResponse,
  IReceiveInventoryInput,
} from "../utils/types/inventory/general";

const ENDPOINT = "inventory";

export async function fetchInventoryCatalog(
  params: IInventoryCatalogQuery = {},
  signal?: AbortSignal,
): Promise<IInventoryCatalogResponse> {
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

  return apiFetch(`/v2/${ENDPOINT}/catalog?${query.toString()}`, { signal });
}

// #sep.out type
export async function fetchInventoryCategories(signal?: AbortSignal): Promise<{
  categories: Array<{
    id: string;
    name: string;
    path: string[];
  }>;
}> {
  return apiFetch(`/v2/${ENDPOINT}/categories`, { signal });
}

export async function fetchInventoryTags(
  signal?: AbortSignal,
): Promise<Pick<IInventoryCatalogItem, "tags">> {
  return apiFetch(`/v2/${ENDPOINT}/tags`, { signal });
}

export async function fetchInventoryItems(
  params: IFetchInventoryItemsQuery = {},
  signal?: AbortSignal,
): Promise<Pick<IInventoryItemsResponse, "items">> {
  const query = new URLSearchParams();

  if (params.q) query.set("q", params.q);
  if (params.include_internal !== undefined) {
    query.set("include_internal", String(params.include_internal));
  }

  const qs = query.toString();
  return apiFetch(`/v2/${ENDPOINT}/items${qs ? `?${qs}` : ""}`, { signal });
}

export async function fetchInventoryItemAttributeDefinitions(
  itemId: string,
  signal?: AbortSignal,
): Promise<IInventoryAttributeDefinitionsResponse> {
  return apiFetch(`/v2/${ENDPOINT}/items/${itemId}/attribute-definitions`, {
    signal,
  });
}

export async function fetchInventoryLocationsTree(
  signal?: AbortSignal,
): Promise<IInventoryLocationsTreeResponse> {
  return apiFetch(`/v2/${ENDPOINT}/locations/tree`, { signal });
}

// INVENTORY LOT

// #sep.out type
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
  return apiFetch(`/v2/${ENDPOINT}/lots/${id}/relocate`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// #WHY do we need receive and fetch?
// #sep.out type
export async function receiveInventory(body: IReceiveInventoryInput) {
  return apiFetch(`/v2/${ENDPOINT}/receive`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function fetchInventoryLot(
  id: string,
  signal?: AbortSignal,
): Promise<IInventoryLotResponse> {
  return apiFetch<IInventoryLotResponse>(`/v2/${ENDPOINT}/lots/${id}`, {
    signal,
  });
}

export async function adjustInventoryLot(
  id: string,
  body: IAdjustInventoryLotInput,
): Promise<IAdjustInventoryLotResponse> {
  return apiFetch<IAdjustInventoryLotResponse>(
    `/v2/${ENDPOINT}/lots/${id}/adjust`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

// #sep.out type
export async function updateInventoryLotAttributes(
  lotId: string,
  body: {
    attributes: Record<string, unknown>;
  },
) {
  return apiFetch(`/v2/${ENDPOINT}/lots/${lotId}/attributes`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}
