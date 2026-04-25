import styles from "../InventoryPage.module.css";

type InventorySummaryBarProps = {
  itemCount: number;
  total: number;
  requestPrereqLoading: boolean;
  profileComplete: boolean;
  hasActiveDraftShipment: boolean;
};

export default function InventorySummaryBar({
  itemCount,
  total,
  requestPrereqLoading,
  profileComplete,
  hasActiveDraftShipment,
}: InventorySummaryBarProps) {
  return (
    <>
      <div className={styles.summaryBar}>
        <div>
          Showing <strong>{itemCount}</strong> items
        </div>
        <div>
          Total results: <strong>{total}</strong>
        </div>
      </div>

      {!requestPrereqLoading && !profileComplete && (
        <div className={styles.error}>
          Complete your requester profile before requesting inventory.
        </div>
      )}

      {!requestPrereqLoading && profileComplete && !hasActiveDraftShipment && (
        <div className={styles.error}>
          Create a draft shipment before requesting inventory.
        </div>
      )}
    </>
  );
}