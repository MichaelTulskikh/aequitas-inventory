import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  createShipmentLine,
  deleteShipmentLine,
  fetchShipments,
  reserveShipmentLine,
  type ShipmentListItem,
} from "../../../api/shipments";
import { getMyRequesterProfile } from "../../../api/requesterProfile";
import { isProfileComplete } from "../utils/inventoryGuards";
import type {
  RequesterProfile,
  RequestingLot,
} from "../types/inventoryPage.types";
import type {
  IInventoryCatalogItem,
  IInventoryCatalogLot,
} from "../../../utils/types/inventory/general";

type UseInventoryRequestOptions = {
  onRequestSuccess?: () => Promise<void> | void;
};

export function useInventoryRequest(options: UseInventoryRequestOptions = {}) {
  const { onRequestSuccess } = options;

  const [requestPrereqLoading, setRequestPrereqLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [activeDraftShipment, setActiveDraftShipment] =
    useState<ShipmentListItem | null>(null);

  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestingLot, setRequestingLot] = useState<RequestingLot | null>(
    null,
  );

  const [requestQuantity, setRequestQuantity] = useState("1");
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestSuccess, setRequestSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRequestPrerequisites() {
      try {
        setRequestPrereqLoading(true);

        const [profileRes, shipmentsRes] = await Promise.all([
          getMyRequesterProfile(),
          fetchShipments({
            mine_only: true,
            status: "draft",
            page: 1,
            page_size: 1,
          }),
        ]);

        if (cancelled) return;

        setProfileComplete(
          isProfileComplete(profileRes.profile as RequesterProfile | null),
        );
        setActiveDraftShipment(shipmentsRes.shipments?.[0] || null);
      } catch {
        if (cancelled) return;

        setProfileComplete(false);
        setActiveDraftShipment(null);
      } finally {
        if (!cancelled) {
          setRequestPrereqLoading(false);
        }
      }
    }

    loadRequestPrerequisites();

    return () => {
      cancelled = true;
    };
  }, []);

  const canRequestLots = useMemo(() => {
    return !requestPrereqLoading && profileComplete && !!activeDraftShipment;
  }, [requestPrereqLoading, profileComplete, activeDraftShipment]);

  const requestDisabledReason = useMemo(() => {
    if (requestPrereqLoading) return "Loading request status...";
    if (!profileComplete) {
      return "Complete your requester profile before requesting inventory.";
    }
    if (!activeDraftShipment) {
      return "Create a draft shipment before requesting inventory.";
    }
    return "";
  }, [requestPrereqLoading, profileComplete, activeDraftShipment]);

  function openRequestModal(
    item: IInventoryCatalogItem,
    lot: IInventoryCatalogLot,
  ) {
    if (!canRequestLots) return;

    setRequestingLot({
      lot_id: lot.inventory_lot_id,
      item_id: item.item_id,
      item_name: item.item_name,
      attributes: lot.attributes || {},
      available_quantity: Number(lot.available_quantity),
      location_name: lot.location_name,
    });

    setRequestQuantity("1");
    setRequestError(null);
    setRequestSuccess(null);
    setRequestModalOpen(true);
  }

  function closeRequestModal() {
    if (requestSaving) return;

    setRequestModalOpen(false);
    setRequestingLot(null);
    setRequestQuantity("1");
    setRequestError(null);
    setRequestSuccess(null);
  }

  async function handleRequestSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!requestingLot || !activeDraftShipment) return;

    const qty = Number(requestQuantity);

    if (!Number.isFinite(qty) || qty < 1) {
      setRequestError("Quantity must be at least 1.");
      return;
    }

    if (qty > requestingLot.available_quantity) {
      setRequestError(
        `Quantity cannot exceed available quantity (${requestingLot.available_quantity}).`,
      );
      return;
    }

    let createdLineId: string | null = null;

    try {
      setRequestSaving(true);
      setRequestError(null);
      setRequestSuccess(null);

      const createdLine = await createShipmentLine(activeDraftShipment.id, {
        item_id: requestingLot.item_id,
        requested_quantity: qty,
        requested_attributes: requestingLot.attributes,
        notes: `Requested from lot ${requestingLot.lot_id}`,
      });

      createdLineId = createdLine.line.id;

      await reserveShipmentLine(createdLine.line.id, {
        inventory_lot_id: requestingLot.lot_id,
        quantity: qty,
        reason: "Requested from inventory page",
        metadata: { source: "inventory_page_modal" },
      });

      setRequestSuccess(
        `Added to shipment ${activeDraftShipment.shipment_number}.`,
      );

      await onRequestSuccess?.();

      setTimeout(() => {
        closeRequestModal();
      }, 800);
    } catch (err: unknown) {
      if (createdLineId) {
        try {
          await deleteShipmentLine(createdLineId);
        } catch {
          // best-effort rollback only
        }
      }
      if (err instanceof Error) {
        setRequestError(err.message);
      } else {
        setRequestError("Failed to request inventory");
      }
    } finally {
      setRequestSaving(false);
    }
  }

  return {
    requestPrereqLoading,
    profileComplete,
    activeDraftShipment,
    canRequestLots,
    requestDisabledReason,

    requestModalOpen,
    requestingLot,
    requestQuantity,
    setRequestQuantity,
    requestSaving,
    requestError,
    requestSuccess,

    openRequestModal,
    closeRequestModal,
    handleRequestSubmit,
  };
}
