import { useMemo } from "react";

import type {
  InventoryCategoryOption,
  InventoryTagOption,
} from "../types/inventoryPage.types";
import type { IInventoryCatalogQuery } from "../../../utils/types/inventory/general";
import {
  useInventoryCatalogQuery,
  useInventoryTagsQuery,
  useInventoryCategoriesQuery,
} from "../../../hooks/queries/inventory/useInventory";

interface IUseInventoryCatalogParams {
  search: string;
  selectedCategoryId: string;
  selectedTagIds: string[];
  palletNumbers: number[];
  boxNumbers: number[];
  page: number;
  pageSize: number;
  showOnlyAvailable: boolean;
  includeInternal: boolean;
}

export function useInventoryCatalog({
  search,
  selectedCategoryId,
  selectedTagIds,
  palletNumbers,
  boxNumbers,
  page,
  pageSize,
  showOnlyAvailable,
  includeInternal,
}: IUseInventoryCatalogParams) {
  const catalogParams = useMemo<IInventoryCatalogQuery>(
    () => ({
      q: search || undefined,
      category_id: selectedCategoryId || undefined,
      tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
      pallet_numbers: palletNumbers.length ? palletNumbers : undefined,
      box_numbers: boxNumbers.length ? boxNumbers : undefined,
      page,
      page_size: pageSize,
      only_available: showOnlyAvailable,
      include_internal: includeInternal,
    }),
    [
      search,
      selectedCategoryId,
      selectedTagIds,
      palletNumbers,
      boxNumbers,
      page,
      pageSize,
      showOnlyAvailable,
      includeInternal,
    ],
  );

  const catalogQuery = useInventoryCatalogQuery(catalogParams);
  const categoriesQuery = useInventoryCategoriesQuery();
  const tagsQuery = useInventoryTagsQuery();

  const response = catalogQuery.data ?? null;
  const items = response?.items ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const categoryOptions: InventoryCategoryOption[] =
    categoriesQuery.data?.categories ?? [];

  const tagOptions: InventoryTagOption[] = tagsQuery.data?.tags ?? [];

  return {
    loading:
      catalogQuery.isLoading ||
      categoriesQuery.isLoading ||
      tagsQuery.isLoading,

    error:
      catalogQuery.error?.message ??
      categoriesQuery.error?.message ??
      tagsQuery.error?.message ??
      null,

    response,
    items,
    total,
    totalPages,
    categoryOptions,
    tagOptions,

    isFetching:
      catalogQuery.isFetching ||
      categoriesQuery.isFetching ||
      tagsQuery.isFetching,

    reload: catalogQuery.refetch,
    reloadCategories: categoriesQuery.refetch,
    reloadTags: tagsQuery.refetch,
  };
}
