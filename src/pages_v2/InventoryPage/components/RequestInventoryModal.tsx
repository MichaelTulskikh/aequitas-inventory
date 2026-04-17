import type { FormEvent } from "react";
import type { ShipmentListItem } from "../../../api/shipments";
import type { RequestingLot } from "../types/inventoryPage.types";
import styles from "../InventoryPage.module.css";

type RequestInventoryModalProps = {
  open: boolean;
  requestingLot: RequestingLot | null;
  activeDraftShipment: ShipmentListItem | null;
  requestQuantity: string;
  setRequestQuantity: (value: string) => void;
  requestSaving: boolean;
  requestError: string | null;
  requestSuccess: string | null;
  onClose: () => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function RequestInventoryModal({
  open,
  requestingLot,
  activeDraftShipment,
  requestQuantity,
  setRequestQuantity,
  requestSaving,
  requestError,
  requestSuccess,
  onClose,
  onSubmit,
}: RequestInventoryModalProps) {
  if (!open || !requestingLot || !activeDraftShipment) {
    return null;
  }

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Request Inventory</h2>
        </div>

        {requestError && (
          <div className={styles.error}>Error: {requestError}</div>
        )}

        {requestSuccess && (
          <div className={styles.success}>{requestSuccess}</div>
        )}

        <form onSubmit={onSubmit}>
          <div className={styles.requestSummary}>
            <div>
              <strong>Shipment:</strong> {activeDraftShipment.shipment_number}
            </div>
            <div>
              <strong>Item:</strong> {requestingLot.item_name}
            </div>
            <div>
              <strong>Location:</strong> {requestingLot.location_name}
            </div>
            <div>
              <strong>Available:</strong> {requestingLot.available_quantity}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="request-quantity" className={styles.label}>
              Quantity
            </label>
            <input
              id="request-quantity"
              type="number"
              min={1}
              max={requestingLot.available_quantity}
              step="1"
              value={requestQuantity}
              onChange={(e) => setRequestQuantity(e.target.value)}
              disabled={requestSaving}
            />
            <div className={styles.formHelp}>
              Enter a quantity from 1 to {requestingLot.available_quantity}.
            </div>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={requestSaving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="app-button"
              disabled={requestSaving}
            >
              {requestSaving ? "Adding..." : "Add to Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}