import { useMutation, useQuery } from "@tanstack/react-query";
import {
  adjustInventoryLot,
  fetchInventoryLot,
  receiveInventory,
  relocateInventoryLot,
  updateInventoryLotAttributes,
} from "../../../api/inventory";
import type {
  IAdjustInventoryLotInput,
  IReceiveInventoryInput,
} from "../../../utils/types/inventory/general";
import { QUERY_KEYS } from "../../../utils/queryKeys";

export const useInventoryLot = (id: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.inventory.lot, id],
    queryFn: ({ signal }) => fetchInventoryLot(id, signal),
    enabled: !!id,
  });

export const useAdjustInventoryLot = () =>
  useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: IAdjustInventoryLotInput;
    }) => adjustInventoryLot(id, body),
  });

export const useUpdateInventoryLotAttributes = () =>
  useMutation({
    mutationFn: ({
      lotId,
      body,
    }: {
      lotId: string;
      body: {
        attributes: Record<string, unknown>;
      };
    }) => updateInventoryLotAttributes(lotId, body),
  });
export const useRelocateInventoryLot = () =>
  useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: {
        to_location_id: string;
        reason?: string;
        metadata?: Record<string, unknown>;
      };
    }) => relocateInventoryLot(id, body),
  });

export const useReceiveInventory = () =>
  useMutation({
    mutationFn: (body: IReceiveInventoryInput) => receiveInventory(body),
  });
