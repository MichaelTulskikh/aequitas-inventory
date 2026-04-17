import type {
  InventoryCatalogItem,
  InventoryCatalogLot,
} from "../../../api/inventory";
import {
  formatAttributeValue,
  formatCategoryPath,
  formatLabel,
} from "../utils/inventoryFormatters";
import styles from "../InventoryPage.module.css";

type InventoryLotRowsProps = {
  item: InventoryCatalogItem;
  isPrivileged: boolean;
  canRequestLots: boolean;
  requestDisabledReason: string;
  onOpenLotModal: (lotId: string) => void;
  onOpenRequestModal: (
    item: InventoryCatalogItem,
    lot: InventoryCatalogLot,
  ) => void;
};

export default function InventoryLotRows({
  item,
  isPrivileged,
  canRequestLots,
  requestDisabledReason,
  onOpenLotModal,
  onOpenRequestModal,
}: InventoryLotRowsProps) {
  if (!item.lots.length) {
    return (
      <tr className={styles.lotRow}>
        <td colSpan={7}>
          <div className={styles.emptyLots}>No lots available.</div>
        </td>
      </tr>
    );
  }

  return (
    <>
      {item.lots.map((lot) => (
        <tr key={lot.inventory_lot_id} className={styles.lotRow}>
          <td />

          <td data-label="Item">
            <div className={styles.lotItemCopy}>
              <div className={styles.lotItemName}>{item.item_name}</div>
              <div className={styles.lotLocation}>{lot.location_name}</div>
              <div className={styles.lotPath}>
                {formatCategoryPath(lot.location_path)}
              </div>
            </div>
          </td>

          <td data-label="Category">
            {item.category ? formatCategoryPath(item.category.path) : "—"}
          </td>

          <td data-label="Tags / Lot Details">
            <div className={styles.lotDetails}>
              {Object.keys(lot.attributes ?? {}).length === 0 ? (
                <span className={styles.muted}>No attributes</span>
              ) : (
                Object.entries(lot.attributes).map(([key, value]) => (
                  <div key={key} className={styles.attributePill}>
                    <strong>{formatLabel(key)}:</strong>{" "}
                    {formatAttributeValue(value)}
                  </div>
                ))
              )}
            </div>
          </td>

          <td data-label="Available" className={`${styles.numeric} ${styles.available}`}>
            {lot.available_quantity}
          </td>

          <td data-label="Admin Info">
            {isPrivileged ? (
              <div className={styles.adminQty}>
                <div>On hand: {lot.on_hand_quantity ?? "—"}</div>
                <div>Reserved: {lot.reserved_quantity ?? "—"}</div>
                <div>Status: {formatLabel(lot.status)}</div>
              </div>
            ) : (
              <div className={styles.adminQty}>
                <div>Status: {formatLabel(lot.status)}</div>
              </div>
            )}
          </td>

          <td className={styles.actions}>
            <button
              type="button"
              className="secondary-button"
              onClick={() => onOpenLotModal(lot.inventory_lot_id)}
            >
              View
            </button>

            <button
              type="button"
              className="app-button"
              onClick={() => onOpenRequestModal(item, lot)}
              disabled={!canRequestLots}
              title={!canRequestLots ? requestDisabledReason : "Request from this lot"}
            >
              Request
            </button>
          </td>
        </tr>
      ))}
    </>
  );
}