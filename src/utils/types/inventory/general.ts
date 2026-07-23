// responses:
export interface IInventoryCatalogResponse {
  items: TInventoryCatalogItems;
  page: number;
  page_size: number;
  total: number;
}

export interface IInventoryItemsResponse {
  items: TInventoryItems;
  page: number;
  page_size: number;
  total: number;
}

export interface IInventoryLocationsTreeResponse {
  locations: TLocationNodes;
}

export interface IInventoryAttributeDefinitionsResponse {
  attributes: TAttributeDefinitions;
}

export interface IInventoryLotResponse {
  lot: IInventoryLotDetail;
}

export interface IAdjustInventoryLotInput {
  delta: number;
  reason: string;
  metadata?: Record<string, unknown>;
}

export interface IAdjustInventoryLotResponse {
  ok: boolean;
  transaction: unknown;
}

// :responses

// query:

export interface IReceiveInventoryInput {
  item_id: string;
  location_id: string;
  quantity: number;
  attributes?: Record<string, unknown>;
  reason?: string;
  received_at?: string;
  source_note?: string;
  status?: string;
  inbound_shipment_id?: string;
}

export interface IInventoryCatalogQuery {
  q?: string;
  category_id?: string;
  tag_ids?: string[];
  pallet_numbers?: number[];
  box_numbers?: number[];
  page?: number;
  page_size?: number;
  only_available?: boolean;
  include_internal?: boolean;
}

export interface IFetchInventoryItemsQuery {
  q?: string;
  include_internal?: boolean;
}
// :query

export type TAttributeDataType =
  | "text"
  | "number"
  | "date"
  | "boolean"
  | "enum";

export type TVisibilityTier = 1 | 2 | 3;

export type TInventoryItems = IInventoryItem[];
export type TInventoryCatalogItems = IInventoryCatalogItem[];
export type TInventoryLots = IInventoryCatalogLot[];
export type TLocationNodes = ILocationNode[];
export type TAttributeDefinitions = IItemAttributeDefinition[];
export type TTags = ITag[];

export interface ICategory {
  id: string;
  name: string;
  path: string[];
}

export interface ITag {
  id: string;
  name: string;
  code: string | null;
}

export interface IInventoryItem {
  id: string;
  name: string;
  description: string | null;
  default_unit: string;
  is_internal_only: boolean;
  category: ICategory | null;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface IInventoryItemOption extends IInventoryItem {}

export interface IItemAttributeDefinition {
  id: string;
  item_id: string;
  attribute_key: string;
  label: string;
  data_type: TAttributeDataType;
  is_required: boolean;
  allowed_values?: unknown[];
  sort_order?: number;
}
export interface ILocationNode {
  id: string;
  parent_location_id?: string | null;
  name: string;
  code?: string | null;
  type: string;
  is_active?: boolean;
  path: string[];
}
export interface IInventoryCatalogLot {
  inventory_lot_id: string;
  location_id: string;
  location_name: string;
  location_path: string[];
  attributes: Record<string, unknown>;
  available_quantity: number;
  on_hand_quantity?: number;
  reserved_quantity?: number;
  lot_image_url: string | null;
  item_image_url: string | null;
  received_at: string | null;
  status: string;
}
export interface IInventoryCatalogItem {
  item_id: string;
  item_name: string;
  item_description: string | null;
  default_unit: string;
  category: ICategory | null;
  tags: TTags;
  primary_image_url: string | null;
  total_available_quantity: number;
  lot_count: number;
  is_internal_only?: boolean;
  lots: TInventoryLots;
}
export interface IInventoryLotAttributeDefinition {
  id: string;
  attribute_key: string;
  label: string;
  data_type: string;
  is_required: boolean;
  allowed_values: unknown[] | null;
  sort_order: number;
}
export interface IInventoryLotDetail {
  inventory_lot_id: string;
  item_id: string;
  item_name: string;
  item_description: string | null;
  default_unit: string;
  location_id: string;
  location_name: string;
  location_path: string[];
  quantity_on_hand?: number;
  quantity_reserved?: number;
  available_quantity: number;
  attributes: Record<string, unknown>;
  status: string;
  received_at: string | null;
  source_note: string | null;
  inbound_shipment_id: string | null;
  inbound_shipment_number: string | null;
  inbound_shipment_reference: string | null;
  inbound_occurred_at: string | null;
  attribute_definitions: IInventoryLotAttributeDefinition[];
  is_internal_only: boolean;
}
