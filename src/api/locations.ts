import { apiFetch } from "./client";

export type LocationType = "warehouse" | "pallet" | "box";

export type BoxNode = {
  id: string;
  name: string;
};

export type PalletNode = {
  id: string;
  name: string;
  boxes: BoxNode[];
};

export type WarehouseNode = {
  id: string;
  name: string;
  pallets: PalletNode[];
};

export async function fetchLocationsTree(): Promise<{
  warehouses: WarehouseNode[];
}> {
  return apiFetch("/locations/tree");
}

export async function createLocation(input: {
  name: string;
  type: LocationType;
  parent_location_id?: string | null;
}) {
  return apiFetch("/locations", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function moveBox(
  box_id: string,
  target_pallet_id: string
) {
  return apiFetch("/locations/move", {
    method: "POST",
    body: JSON.stringify({ box_id, target_pallet_id }),
  });
}
