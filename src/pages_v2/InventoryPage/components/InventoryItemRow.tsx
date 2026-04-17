import type { ReactNode } from "react";
import type { InventoryCatalogItem } from "../../../api/inventory";
import { formatCategoryPath, formatLotCount } from "../utils/inventoryFormatters";
import styles from "../InventoryPage.module.css";

type InventoryItemRowProps = {
  item: InventoryCatalogItem;
  expanded: boolean;
  isPrivileged: boolean;
  onToggleExpanded: () => void;
  tagsContent: ReactNode;
};

export default function InventoryItemRow({
  item,
  expanded,
  isPrivileged,
  onToggleExpanded,
  tagsContent,
}: InventoryItemRowProps) {
  return (
    <tr className={styles.itemRow}>
      <td className={styles.expandCell}>
        <button
          type="button"
          className={styles.expandButton}
          onClick={onToggleExpanded}
          aria-label={expanded ? "Collapse lots" : "Expand lots"}
        >
          {expanded ? "▾" : "▸"}
        </button>
      </td>

      <td data-label="Item">
        <div>
          <div className={styles.itemName}>{item.item_name}</div>
          {item.item_description && (
            <div className={styles.itemDescription}>{item.item_description}</div>
          )}
        </div>
      </td>

      <td data-label="Category">
        {item.category ? formatCategoryPath(item.category.path) : "—"}
      </td>

      <td data-label="Tags / Variant Summary">
        <div className={styles.metaCell}>
          {tagsContent}
          <div className={styles.lotCount}>{formatLotCount(item.lot_count)}</div>
        </div>
      </td>

      <td data-label="Available" className={`${styles.numeric} ${styles.available}`}>
        {item.total_available_quantity}
      </td>

      <td data-label="Admin Info">
        {isPrivileged ? (
          <div className={styles.adminQty}>
            <div>Default unit: {item.default_unit}</div>
            <div>Internal only: {item.is_internal_only ? "Yes" : "No"}</div>
          </div>
        ) : (
          <span className={styles.muted}>—</span>
        )}
      </td>

      <td className={styles.itemRowNote}>
        <span className={styles.muted}>
          {expanded ? "Lots shown below" : "Expand for lots"}
        </span>
      </td>
    </tr>
  );
}