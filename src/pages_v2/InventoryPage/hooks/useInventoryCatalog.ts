import { useCallback, useEffect, useState } from "react";
import {
  fetchInventoryCatalog,
  fetchInventoryCategories,
  fetchInventoryTags,
  type InventoryCatalogResponse,
} from "../../../api/inventory";
import type {
  InventoryCategoryOption,
  InventoryTagOption,
} from "../types/inventoryPage.types";

type UseInventoryCatalogParams = {
  search: string;
  selectedCategoryId: string;
  selectedTagIds: string[];
  palletNumbers: number[];
  boxNumbers: number[];
  page: number;
  pageSize: number;
  showOnlyAvailable: boolean;
  includeInternal: boolean;
};

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
}: UseInventoryCatalogParams) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [response, setResponse] = useState<InventoryCatalogResponse | null>(
    null,
  );

  const [categoryOptions, setCategoryOptions] = useState<
    InventoryCategoryOption[]
  >([]);
  const [tagOptions, setTagOptions] = useState<InventoryTagOption[]>([]);

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await fetchInventoryCatalog({
        q: search || undefined,
        category_id: selectedCategoryId || undefined,
        tag_ids: selectedTagIds.length ? selectedTagIds : undefined,
        pallet_numbers: palletNumbers.length ? palletNumbers : undefined,
        box_numbers: boxNumbers.length ? boxNumbers : undefined,
        page,
        page_size: pageSize,
        only_available: showOnlyAvailable,
        include_internal: includeInternal,
      });

      setResponse(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [
    search,
    selectedCategoryId,
    selectedTagIds,
    palletNumbers,
    boxNumbers,
    page,
    pageSize,
    showOnlyAvailable,
    includeInternal,
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadFilterOptions() {
      try {
        const [categories, tags] = await Promise.all([
          fetchInventoryCategories(),
          fetchInventoryTags(),
        ]);

        if (cancelled) return;

        setCategoryOptions(categories.categories);
        setTagOptions(tags.tags);
      } catch {
        if (cancelled) return;

        setCategoryOptions([]);
        setTagOptions([]);
      }
    }

    loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const items = response?.items ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return {
    loading,
    error,
    response,
    items,
    total,
    totalPages,
    categoryOptions,
    tagOptions,
    reload: loadInventory,
  };
}