import { useMemo, type Dispatch, type SetStateAction } from "react";
import type { InventoryTagOption } from "../types/inventoryPage.types";
import styles from "../InventoryPage.module.css";

type InventoryTagMultiSelectProps = {
  tagOptions: InventoryTagOption[];
  selectedTagIds: string[];
  setSelectedTagIds: Dispatch<SetStateAction<string[]>>;
  tagSearch: string;
  setTagSearch: (value: string) => void;
  tagDropdownOpen: boolean;
  setTagDropdownOpen: (value: boolean) => void;
  onChanged?: () => void;
};

export default function InventoryTagMultiSelect({
  tagOptions,
  selectedTagIds,
  setSelectedTagIds,
  tagSearch,
  setTagSearch,
  tagDropdownOpen,
  setTagDropdownOpen,
  onChanged,
}: InventoryTagMultiSelectProps) {
  const selectedTags = useMemo(() => {
    return selectedTagIds
      .map((id) => tagOptions.find((tag) => tag.id === id))
      .filter((tag): tag is InventoryTagOption => !!tag);
  }, [selectedTagIds, tagOptions]);

  const filteredOptions = useMemo(() => {
    const query = tagSearch.trim().toLowerCase();

    return tagOptions
      .filter((tag) => !selectedTagIds.includes(tag.id))
      .filter((tag) => {
        if (!query) return true;
        return tag.name.toLowerCase().includes(query);
      })
      .slice(0, 10);
  }, [tagOptions, selectedTagIds, tagSearch]);

  function removeTag(tagId: string) {
    setSelectedTagIds((prev) => prev.filter((id) => id !== tagId));
    onChanged?.();
  }

  function addTag(tagId: string) {
    setSelectedTagIds((prev) => [...prev, tagId]);
    setTagSearch("");
    setTagDropdownOpen(false);
    onChanged?.();
  }

  return (
    <div className={styles.tagSelector}>
      <div className={styles.tagSelected}>
        {selectedTags.map((tag) => (
          <span key={tag.id} className={styles.tagChip}>
            {tag.name}
            <button
              type="button"
              className={styles.tagChipButton}
              onClick={() => removeTag(tag.id)}
              aria-label={`Remove ${tag.name}`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <input
        placeholder="Add tag..."
        value={tagSearch}
        onChange={(e) => {
          setTagSearch(e.target.value);
          setTagDropdownOpen(true);
        }}
        onFocus={() => setTagDropdownOpen(true)}
      />

      {tagDropdownOpen && (
        <div className={styles.tagDropdown}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((tag) => (
              <button
                key={tag.id}
                type="button"
                className={styles.tagOption}
                onClick={() => addTag(tag.id)}
              >
                {tag.name}
              </button>
            ))
          ) : (
            <div className={styles.tagOptionMuted}>No matching tags</div>
          )}
        </div>
      )}
    </div>
  );
}