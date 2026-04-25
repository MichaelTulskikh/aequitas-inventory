import type {
  Dispatch,
  KeyboardEvent,
  SetStateAction,
} from "react";
import type {
  InventoryCategoryOption,
  InventoryTagOption,
} from "../types/inventoryPage.types";
import InventoryTagMultiSelect from "./InventoryTagMultiSelect";
import styles from "../InventoryPage.module.css";

type InventoryFiltersProps = {
  isPrivileged: boolean;
  categoryOptions: InventoryCategoryOption[];
  tagOptions: InventoryTagOption[];

  searchDraft: string;
  setSearchDraft: (value: string) => void;
  applySearch: () => void;

  palletSearchDraft: string;
  setPalletSearchDraft: (value: string) => void;
  applyPalletSearch: () => void;

  boxSearchDraft: string;
  setBoxSearchDraft: (value: string) => void;
  applyBoxSearch: () => void;

  selectedCategoryId: string;
  setSelectedCategoryId: (value: string) => void;

  selectedTagIds: string[];
  setSelectedTagIds: Dispatch<SetStateAction<string[]>>;

  tagSearch: string;
  setTagSearch: (value: string) => void;
  tagDropdownOpen: boolean;
  setTagDropdownOpen: (value: boolean) => void;

  showOnlyAvailable: boolean;
  setShowOnlyAvailable: Dispatch<SetStateAction<boolean>>;

  includeInternal: boolean;
  setIncludeInternal: Dispatch<SetStateAction<boolean>>;

  clearFilters: () => void;
  resetToFirstPage: () => void;
};

export default function InventoryFilters({
  isPrivileged,
  categoryOptions,
  tagOptions,
  searchDraft,
  setSearchDraft,
  applySearch,
  palletSearchDraft,
  setPalletSearchDraft,
  applyPalletSearch,
  boxSearchDraft,
  setBoxSearchDraft,
  applyBoxSearch,
  selectedCategoryId,
  setSelectedCategoryId,
  selectedTagIds,
  setSelectedTagIds,
  tagSearch,
  setTagSearch,
  tagDropdownOpen,
  setTagDropdownOpen,
  showOnlyAvailable,
  setShowOnlyAvailable,
  includeInternal,
  setIncludeInternal,
  clearFilters,
  resetToFirstPage,
}: InventoryFiltersProps) {
  function onEnter(e: KeyboardEvent<HTMLInputElement>, handler: () => void) {
    if (e.key === "Enter") {
      handler();
      resetToFirstPage();
    }
  }

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroupSearch}>
        <label className={styles.label}>Search</label>
        <input
          placeholder="Search items..."
          value={searchDraft}
          onChange={(e) => setSearchDraft(e.target.value)}
          onKeyDown={(e) => onEnter(e, applySearch)}
          onBlur={() => {
            applySearch();
            resetToFirstPage();
          }}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Pallets</label>
        <input
          placeholder="e.g. 2, 5"
          value={palletSearchDraft}
          onChange={(e) => setPalletSearchDraft(e.target.value)}
          onKeyDown={(e) => onEnter(e, applyPalletSearch)}
          onBlur={() => {
            applyPalletSearch();
            resetToFirstPage();
          }}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Boxes</label>
        <input
          placeholder="e.g. 6, 7, 35"
          value={boxSearchDraft}
          onChange={(e) => setBoxSearchDraft(e.target.value)}
          onKeyDown={(e) => onEnter(e, applyBoxSearch)}
          onBlur={() => {
            applyBoxSearch();
            resetToFirstPage();
          }}
        />
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Category</label>
        <select
          className={styles.select}
          value={selectedCategoryId}
          onChange={(e) => {
            setSelectedCategoryId(e.target.value);
            resetToFirstPage();
          }}
        >
          <option value="">All categories</option>
          {categoryOptions.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.path.join(" / ")}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.label}>Tags</label>
        <InventoryTagMultiSelect
          tagOptions={tagOptions}
          selectedTagIds={selectedTagIds}
          setSelectedTagIds={setSelectedTagIds}
          tagSearch={tagSearch}
          setTagSearch={setTagSearch}
          tagDropdownOpen={tagDropdownOpen}
          setTagDropdownOpen={setTagDropdownOpen}
          onChanged={resetToFirstPage}
        />
      </div>

      <div className={styles.filterGroupVisibility}>
        <label className={styles.label}>Visibility</label>
        <div className={styles.visibilityInline}>
          <button
            type="button"
            className={`${styles.visibilityChip} ${
              showOnlyAvailable ? styles.visibilityChipActive : ""
            }`}
            onClick={() => {
              setShowOnlyAvailable((prev) => !prev);
              resetToFirstPage();
            }}
          >
            Available
          </button>

          {isPrivileged && (
            <button
              type="button"
              className={`${styles.visibilityChip} ${
                includeInternal ? styles.visibilityChipActive : ""
              }`}
              onClick={() => {
                setIncludeInternal((prev) => !prev);
                resetToFirstPage();
              }}
            >
              Internal
            </button>
          )}
        </div>
      </div>

      <div className={styles.filterGroupApply}>
        <button
          type="button"
          className="secondary-button"
          onClick={clearFilters}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}