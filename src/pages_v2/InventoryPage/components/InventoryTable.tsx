import { Fragment, type ReactNode } from "react";
import type {
  InventoryCatalogItem,
  InventoryCatalogLot,
} from "../../../api/inventory";
import InventoryItemRow from "./InventoryItemRow";
import InventoryLotRows from "./InventoryLotRows";
import styles from "../InventoryPage.module.css";

type InventoryTableProps = {
  items: InventoryCatalogItem[];
  loading: boolean;
  isPrivileged: boolean;
  expandedItems: Record<string, boolean>;
  toggleExpanded: (itemId: string) => void;
  canRequestLots: boolean;
  requestDisabledReason: string;
  onOpenLotModal: (lotId: string) => void;
  onOpenRequestModal: (
    item: InventoryCatalogItem,
    lot: InventoryCatalogLot,
  ) => void;
  renderTags: (item: InventoryCatalogItem) => ReactNode;
};

export default function InventoryTable({
  items,
  loading,
  isPrivileged,
  expandedItems,
  toggleExpanded,
  canRequestLots,
  requestDisabledReason,
  onOpenLotModal,
  onOpenRequestModal,
  renderTags,
}: InventoryTableProps) {
  return (
    <div className={styles.tablepage__wrapper}>
      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Loading inventory…</span>
        </div>
      )}

      <table
        className={`${styles.table} ${loading ? styles.tableBlurred : ""}`}
      >
        <thead>
          <tr>
            <th />
            <th>Item</th>
            <th>Category</th>
            <th>Tags / Variant Summary</th>
            <th className={styles.numeric}>Available</th>
            <th>Admin Info</th>
            <th className={styles.actionsCol}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {items.map((item) => {
            const expanded = !!expandedItems[item.item_id];

            return (
              <Fragment key={item.item_id}>
                <InventoryItemRow
                  item={item}
                  expanded={expanded}
                  isPrivileged={isPrivileged}
                  onToggleExpanded={() => toggleExpanded(item.item_id)}
                  tagsContent={renderTags(item)}
                />

                {expanded && (
                  <InventoryLotRows
                    item={item}
                    isPrivileged={isPrivileged}
                    canRequestLots={canRequestLots}
                    requestDisabledReason={requestDisabledReason}
                    onOpenLotModal={onOpenLotModal}
                    onOpenRequestModal={onOpenRequestModal}
                  />
                )}
              </Fragment>
            );
          })}

          {!loading && items.length === 0 && (
            <tr>
              <td colSpan={7}>
                <div className={styles.emptyState}>
                  No inventory matches the current filters.
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
