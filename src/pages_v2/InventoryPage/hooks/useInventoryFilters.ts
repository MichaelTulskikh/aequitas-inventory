import { useState } from "react";
import { normalizeSearchInput, parseNumberList } from "../utils/inventoryParsers";

export function useInventoryFilters() {
  const [searchDraft, setSearchDraft] = useState("");
  const [search, setSearch] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [includeInternal, setIncludeInternal] = useState(false);

  const [tagSearch, setTagSearch] = useState("");
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);

  const [palletSearchDraft, setPalletSearchDraft] = useState("");
  const [boxSearchDraft, setBoxSearchDraft] = useState("");
  const [palletNumbers, setPalletNumbers] = useState<number[]>([]);
  const [boxNumbers, setBoxNumbers] = useState<number[]>([]);

  function resetToFirstPage() {
    setPage(1);
  }

  function applySearch() {
    setSearch(normalizeSearchInput(searchDraft));
  }

  function applyPalletSearch() {
    setPalletNumbers(parseNumberList(palletSearchDraft));
  }

  function applyBoxSearch() {
    setBoxNumbers(parseNumberList(boxSearchDraft));
  }

  function updateCategory(value: string) {
    setSelectedCategoryId(value);
    resetToFirstPage();
  }

  function clearFilters() {
    setSearchDraft("");
    setSearch("");
    setSelectedCategoryId("");
    setSelectedTagIds([]);
    setPalletSearchDraft("");
    setBoxSearchDraft("");
    setPalletNumbers([]);
    setBoxNumbers([]);
    setShowOnlyAvailable(true);
    setIncludeInternal(false);
    setTagSearch("");
    setTagDropdownOpen(false);
    setPage(1);
  }

  return {
    searchDraft,
    setSearchDraft,
    search,
    setSearch,
    applySearch,

    selectedCategoryId,
    setSelectedCategoryId,
    updateCategory,

    selectedTagIds,
    setSelectedTagIds,

    page,
    setPage,
    pageSize,
    setPageSize,

    showOnlyAvailable,
    setShowOnlyAvailable,
    includeInternal,
    setIncludeInternal,

    tagSearch,
    setTagSearch,
    tagDropdownOpen,
    setTagDropdownOpen,

    palletSearchDraft,
    setPalletSearchDraft,
    boxSearchDraft,
    setBoxSearchDraft,
    palletNumbers,
    boxNumbers,
    applyPalletSearch,
    applyBoxSearch,

    resetToFirstPage,
    clearFilters,

    setPalletNumbers,
    setBoxNumbers,
  };
}