import { useQuery } from "@tanstack/react-query";
import {
  fetchInventoryCatalog,
  fetchInventoryCategories,
  fetchInventoryItemAttributeDefinitions,
  fetchInventoryItems,
  fetchInventoryLocationsTree,
  fetchInventoryTags,
} from "../../api/inventory";
import type {
  IFetchInventoryItemsQuery,
  IInventoryCatalogQuery,
} from "../../utils/types/inventory/general";
import { QUERY_KEYS } from "../../utils/queryKeys";

export const useInventoryCatalog = (params: IInventoryCatalogQuery = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.inventory.catalog, params],
    queryFn: ({ signal }) => fetchInventoryCatalog(params, signal),
  });
export const useInventoryCategories = () =>
  useQuery({
    queryKey: [QUERY_KEYS.inventory.categories],
    queryFn: ({ signal }) => fetchInventoryCategories(signal),
  });
export const useInventoryTags = () =>
  useQuery({
    queryKey: [QUERY_KEYS.inventory.tags],
    queryFn: ({ signal }) => fetchInventoryTags(signal),
  });
export const useInventoryItems = (params: IFetchInventoryItemsQuery = {}) =>
  useQuery({
    queryKey: [QUERY_KEYS.inventory.items, params],
    queryFn: ({ signal }) => fetchInventoryItems(params, signal),
  });
export const useInventoryItemAttributeDefinitions = (itemId: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.inventory.itemAttributeDefinitions, itemId],
    queryFn: ({ signal }) =>
      fetchInventoryItemAttributeDefinitions(itemId, signal),
    enabled: !!itemId,
  });
export const useInventoryLocationsTree = () =>
  useQuery({
    queryKey: [QUERY_KEYS.inventory.locationsTree],
    queryFn: ({ signal }) => fetchInventoryLocationsTree(signal),
  });
