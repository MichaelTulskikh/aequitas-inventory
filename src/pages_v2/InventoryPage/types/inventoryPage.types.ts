export type RequesterProfile = {
  id: string;
  full_name: string | null;
  signing_representative_name: string | null;
  edrpou: string | null;
  phone: string | null;
  email: string | null;
  official_address: string | null;
  delivery_address: string | null;
};

export type InventoryCategoryOption = {
  id: string;
  name: string;
  path: string[];
};

export type InventoryTagOption = {
  id: string;
  name: string;
  code: string | null;
};

export type RequestingLot = {
  lot_id: string;
  item_id: string;
  item_name: string;
  attributes: Record<string, unknown>;
  available_quantity: number;
  location_name: string;
};