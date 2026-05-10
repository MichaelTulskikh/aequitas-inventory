import React, { useEffect, useMemo, useState } from "react";
// import { Link, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { apiFetch } from "../../api/client";
import { type InboundShipmentLine } from "../../api/inventory_v2";
import styles from "./InboundShipmentsPage.module.css";

type InboundShipmentStatus = "open" | "closed" | "cancelled";

type InboundShipment = {
  id: string;
  shipment_number: string;

  declaration_id: string;
  declaration_number: string;
  declaration_is_undeclared: boolean;

  donor_id: string | null;
  donor_display_name: string | null;

  notes: string | null;
  status: InboundShipmentStatus;
  received_at: string;

  received_by_account_id: string | null;
  created_at: string;
  updated_at: string;

  line_count: number;
  received_quantity: number;
};

type DeclarationOption = {
  id: string;
  declaration_number: string;
  donor_id: string | null;
  is_undeclared: boolean;
  country_code: string | null;
  declared_at: string | null;
  notes: string | null;
  donor: {
    id: string;
    display_name: string;
    legal_name: string | null;
    country_code: string | null;
  } | null;
};

type ItemOption = {
  id: string;
  name: string;
  description?: string | null;
  default_unit?: string | null;
  category?: {
    id: string;
    name: string;
    path: string[];
  } | null;
};

type FetchInboundShipmentsResponse = {
  shipments: InboundShipment[];
};

type GetInboundShipmentResponse = {
  shipment: InboundShipment;
};

type ListInboundShipmentLinesResponse = {
  lines: InboundShipmentLine[];
};

type FetchDeclarationsResponse = {
  items: DeclarationOption[];
};

type FetchInventoryItemsResponse = {
  items: ItemOption[];
};

type LocationNode = {
  id: string;
  parent_location_id?: string | null;
  name: string;
  code?: string | null;
  type: string;
  is_active?: boolean;
  path: string[];
};

type FetchInventoryLocationsResponse = {
  locations: LocationNode[];
};

type ItemAttributeDefinition = {
  id: string;
  item_id: string;
  attribute_key: string;
  label: string;
  data_type: "text" | "number" | "date" | "boolean" | "enum";
  is_required: boolean;
  allowed_values?: unknown[];
  sort_order?: number;
};

async function fetchInboundShipments(params?: {
  q?: string;
  status?: string;
  declaration_id?: string;
  donor_id?: string;
}): Promise<FetchInboundShipmentsResponse> {
  const search = new URLSearchParams();

  if (params?.q) search.set("q", params.q);
  if (params?.status) search.set("status", params.status);
  if (params?.declaration_id)
    search.set("declaration_id", params.declaration_id);
  if (params?.donor_id) search.set("donor_id", params.donor_id);

  const suffix = search.toString() ? `?${search.toString()}` : "";
  return apiFetch(
    `/v2/inbound-shipments${suffix}`,
  ) as Promise<FetchInboundShipmentsResponse>;
}

async function getInboundShipment(
  id: string,
): Promise<GetInboundShipmentResponse> {
  return apiFetch(
    `/v2/inbound-shipments/${id}`,
  ) as Promise<GetInboundShipmentResponse>;
}

async function createInboundShipment(payload: {
  shipment_number: string;
  declaration_id: string;
  received_at: string;
  notes?: string | null;
  status?: InboundShipmentStatus | null;
}) {
  return apiFetch("/v2/inbound-shipments", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ shipment: InboundShipment }>;
}

async function updateInboundShipment(
  id: string,
  payload: {
    shipment_number?: string | null;
    declaration_id?: string | null;
    received_at?: string | null;
    notes?: string | null;
    status?: InboundShipmentStatus | null;
  },
) {
  return apiFetch(`/v2/inbound-shipments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }) as Promise<{ shipment: InboundShipment }>;
}

async function listInboundShipmentLines(
  inboundShipmentId: string,
): Promise<ListInboundShipmentLinesResponse> {
  return apiFetch(
    `/v2/inbound-shipments/${inboundShipmentId}/lines`,
  ) as Promise<ListInboundShipmentLinesResponse>;
}

async function createInboundShipmentLine(
  inboundShipmentId: string,
  payload: {
    item_id: string;
    quantity_received: number;
    attributes?: Record<string, unknown>;
    received_at?: string | null;
    notes?: string | null;
  },
): Promise<{ line: InboundShipmentLine }> {
  return apiFetch(`/v2/inbound-shipments/${inboundShipmentId}/lines`, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ line: InboundShipmentLine }>;
}

async function updateInboundShipmentLine(
  lineId: string,
  payload: {
    quantity_received?: number | null;
    attributes?: Record<string, unknown> | null;
    received_at?: string | null;
    notes?: string | null;
  },
) {
  return apiFetch(`/v2/inbound-shipment-lines/${lineId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

async function fetchDeclarations(): Promise<FetchDeclarationsResponse> {
  return apiFetch("/v2/declarations") as Promise<FetchDeclarationsResponse>;
}

async function fetchInventoryItems(): Promise<FetchInventoryItemsResponse> {
  return apiFetch(
    "/v2/inventory/items",
  ) as Promise<FetchInventoryItemsResponse>;
}

async function fetchInventoryLocationsTree(): Promise<FetchInventoryLocationsResponse> {
  return apiFetch(
    "/v2/inventory/locations/tree",
  ) as Promise<FetchInventoryLocationsResponse>;
}

async function fetchInventoryItemAttributeDefinitions(
  itemId: string,
): Promise<{ attributes: ItemAttributeDefinition[] }> {
  return apiFetch(
    `/v2/inventory/items/${itemId}/attribute-definitions`,
  ) as Promise<{ attributes: ItemAttributeDefinition[] }>;
}

async function moveInboundShipmentLine(
  lineId: string,
  payload: {
    to_inbound_shipment_id: string;
    reason?: string | null;
  },
): Promise<{ ok: true; line: InboundShipmentLine }> {
  return apiFetch(`/v2/inbound-shipment-lines/${lineId}/move`, {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{ ok: true; line: InboundShipmentLine }>;
}

function formatPath(path?: string[]): string {
  return path?.length ? path.join(" / ") : "—";
}

async function receiveInventory(payload: {
  inbound_shipment_line_id: string;
  location_id: string;
  quantity: number;
  visibility_tier?: number;
  reason?: string;
  received_at?: string | null;
}) {
  return apiFetch("/v2/inventory/receive", {
    method: "POST",
    body: JSON.stringify(payload),
  }) as Promise<{
    ok: boolean;
    inventory_lot_id: string;
    inventory_txn_id: string;
  }>;
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

function toDatetimeLocalValue(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function nowDatetimeLocalValue(): string {
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toApiDatetime(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString();
}

function stringifyAttributes(
  value: Record<string, unknown> | null | undefined,
): string {
  try {
    return JSON.stringify(value ?? {}, null, 2);
  } catch {
    return "{}";
  }
}

function emptyShipmentForm() {
  return {
    shipment_number: "",
    declaration_id: "",
    received_at: nowDatetimeLocalValue(),
    notes: "",
    status: "open" as InboundShipmentStatus,
  };
}

function emptyLineForm() {
  return {
    item_id: "",
    quantity_received: "",
    // attributes_text: "{}",
    received_at: nowDatetimeLocalValue(),
    notes: "",
  };
}

// function buildReceiveLink(
//   shipmentId: string,
//   lineId: string,
//   itemId: string,
// ): string {
//   const params = new URLSearchParams({
//     inbound_shipment_id: shipmentId,
//     inbound_shipment_line_id: lineId,
//     item_id: itemId,
//   });

//   return `/inventory/receive?${params.toString()}`;
// }

export default function InboundShipmentsPage() {
  // const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [savingShipment, setSavingShipment] = useState(false);
  const [savingLine, setSavingLine] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [shipments, setShipments] = useState<InboundShipment[]>([]);
  const [declarations, setDeclarations] = useState<DeclarationOption[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [lines, setLines] = useState<InboundShipmentLine[]>([]);

  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [savingReceive, setSavingReceive] = useState(false);

  const [selectedShipmentId, setSelectedShipmentId] = useState<string | null>(
    null,
  );
  const [editingShipmentId, setEditingShipmentId] = useState<string | null>(
    null,
  );
  const [editingLineId, setEditingLineId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [declarationFilter, setDeclarationFilter] = useState("");

  const [shipmentForm, setShipmentForm] = useState(emptyShipmentForm());
  const [lineForm, setLineForm] = useState(emptyLineForm());

  const [receivingLineId, setReceivingLineId] = useState<string | null>(null);

  const [lineAttributeDefs, setLineAttributeDefs] = useState<
    ItemAttributeDefinition[]
  >([]);
  const [lineAttributeValues, setLineAttributeValues] = useState<
    Record<string, unknown>
  >({});

  const [receiveForm, setReceiveForm] = useState({
    lineId: "",
    location_id: "",
    quantity: "",
    visibility_tier: "3",
    reason: "",
  });

  const [movingLineId, setMovingLineId] = useState<string | null>(null);
  const [savingMove, setSavingMove] = useState(false);

  const [moveForm, setMoveForm] = useState({
    to_inbound_shipment_id: "",
    reason: "",
  });

  function resetMoveForm() {
    setMovingLineId(null);
    setMoveForm({
      to_inbound_shipment_id: "",
      reason: "",
    });
  }

  function startMoveLine(line: InboundShipmentLine) {
    setMovingLineId(line.id);
    setReceivingLineId(null);
    setEditingLineId(null);
    setMoveForm({
      to_inbound_shipment_id: "",
      reason: "",
    });
  }

  function startReceiveLine(line: InboundShipmentLine) {
    setReceivingLineId(line.id);
    setMovingLineId(null);
    setReceiveForm({
      lineId: line.id,
      location_id: "",
      quantity: String(line.quantity_remaining ?? ""),
      visibility_tier: "3",
      reason: "",
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [shipmentsRes, declarationsRes, itemsRes, locationsRes] =
          await Promise.all([
            fetchInboundShipments(),
            fetchDeclarations(),
            fetchInventoryItems(),
            fetchInventoryLocationsTree(),
          ]);

        if (cancelled) return;

        setShipments(shipmentsRes.shipments || []);
        setDeclarations(declarationsRes.items || []);
        setItems(itemsRes.items || []);
        setLocations(locationsRes.locations || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load inbound shipments page");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLines() {
      if (!selectedShipmentId) {
        setLines([]);
        return;
      }

      try {
        const res = await listInboundShipmentLines(selectedShipmentId);
        if (cancelled) return;
        setLines(res.lines || []);
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load shipment lines");
      }
    }

    loadLines();

    return () => {
      cancelled = true;
    };
  }, [selectedShipmentId]);

  useEffect(() => {
    let cancelled = false;

    async function loadDefs() {
      const itemId = lineForm.item_id.trim();

      if (!itemId) {
        setLineAttributeDefs([]);
        setLineAttributeValues({});
        return;
      }

      try {
        const res = await fetchInventoryItemAttributeDefinitions(itemId);
        if (cancelled) return;

        const defs = res.attributes || [];
        setLineAttributeDefs(defs);

        setLineAttributeValues((prev) => {
          const next: Record<string, unknown> = {};

          for (const def of defs) {
            if (prev[def.attribute_key] !== undefined) {
              next[def.attribute_key] = prev[def.attribute_key];
            } else if (def.data_type === "boolean") {
              next[def.attribute_key] = def.is_required ? false : undefined;
            } else {
              next[def.attribute_key] = "";
            }
          }

          return next;
        });
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load item attribute definitions");
          setLineAttributeDefs([]);
          setLineAttributeValues({});
        }
      }
    }

    loadDefs();

    return () => {
      cancelled = true;
    };
  }, [lineForm.item_id]);

  const filteredShipments = useMemo(() => {
    const q = search.trim().toLowerCase();

    return shipments.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      if (declarationFilter && item.declaration_id !== declarationFilter)
        return false;

      if (!q) return true;

      return [
        item.shipment_number,
        item.declaration_number,
        item.donor_display_name || "",
        item.notes || "",
        item.status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
  }, [shipments, search, statusFilter, declarationFilter]);

  const selectedShipment = useMemo(() => {
    return shipments.find((s) => s.id === selectedShipmentId) || null;
  }, [shipments, selectedShipmentId]);

  const canEditSelectedShipment = selectedShipment?.status === "open";

  function resetShipmentForm() {
    setShipmentForm(emptyShipmentForm());
    setEditingShipmentId(null);
  }

  function resetLineForm() {
    setLineForm(emptyLineForm());
    setEditingLineId(null);
    setLineAttributeDefs([]);
    setLineAttributeValues({});
  }

  function selectShipment(item: InboundShipment) {
    setSelectedShipmentId(item.id);
    setEditingLineId(null);
    setLineAttributeDefs([]);
    setLineAttributeValues({});
    setReceivingLineId(null);
    setReceiveForm({
      lineId: "",
      location_id: "",
      quantity: "",
      visibility_tier: "3",
      reason: "",
    });
    setMovingLineId(null);
    setMoveForm({
      to_inbound_shipment_id: "",
      reason: "",
    });
    resetLineForm();
    setSuccess(null);
    setError(null);
    document
      .getElementById("shipmentLinesEditor")
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function startEditShipment(item: InboundShipment) {
    setEditingShipmentId(item.id);
    setSelectedShipmentId(item.id);
    setSuccess(null);
    setError(null);
    setShipmentForm({
      shipment_number: item.shipment_number,
      declaration_id: item.declaration_id,
      received_at: toDatetimeLocalValue(item.received_at),
      notes: item.notes || "",
      status: item.status,
    });
    setReceivingLineId(null);
    setReceiveForm({
      lineId: "",
      location_id: "",
      quantity: "",
      visibility_tier: "3",
      reason: "",
    });
    setMovingLineId(null);
    setMoveForm({
      to_inbound_shipment_id: "",
      reason: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startEditLine(item: InboundShipmentLine) {
    if (!canEditSelectedShipment) return;

    setEditingLineId(item.id);
    setSuccess(null);
    setError(null);
    setReceivingLineId(null);
    setMovingLineId(null);
    setLineForm({
      item_id: item.item_id,
      quantity_received: String(item.quantity_received),
      // attributes_text: stringifyAttributes(item.attributes),
      received_at: toDatetimeLocalValue(item.received_at),
      notes: item.notes || "",
    });
    setLineAttributeValues(item.attributes ?? {});
  }

  async function reloadShipments() {
    const res = await fetchInboundShipments();
    setShipments(res.shipments || []);
  }

  async function reloadSelectedShipmentAndLines(shipmentId: string) {
    const [shipmentRes, linesRes] = await Promise.all([
      getInboundShipment(shipmentId),
      listInboundShipmentLines(shipmentId),
    ]);

    setShipments((prev) => {
      const next = [...prev];
      const index = next.findIndex((x) => x.id === shipmentId);
      if (index >= 0) {
        next[index] = shipmentRes.shipment;
      } else {
        next.unshift(shipmentRes.shipment);
      }
      return next;
    });

    setSelectedShipmentId(shipmentId);
    setLines(linesRes.lines || []);
    return linesRes.lines || [];
  }

  function buildShipmentPayload() {
    const shipment_number = shipmentForm.shipment_number.trim();
    const declaration_id = shipmentForm.declaration_id.trim();
    const received_at = toApiDatetime(shipmentForm.received_at);

    if (!shipment_number) {
      throw new Error("Shipment number is required.");
    }

    if (!declaration_id) {
      throw new Error("Declaration is required.");
    }

    if (!received_at) {
      throw new Error("Received at is required and must be valid.");
    }

    return {
      shipment_number,
      declaration_id,
      received_at,
      notes: shipmentForm.notes.trim() ? shipmentForm.notes.trim() : null,
      status: shipmentForm.status,
    };
  }

  function buildLineAttributesFromForm() {
    const attrs: Record<string, unknown> = {};

    for (const def of lineAttributeDefs) {
      const raw = lineAttributeValues[def.attribute_key];

      if (raw === undefined || raw === null || raw === "") {
        if (def.is_required) {
          throw new Error(`${def.label} is required.`);
        }
        continue;
      }

      switch (def.data_type) {
        case "text":
          attrs[def.attribute_key] = String(raw).trim();
          break;

        case "number": {
          const n = Number(raw);
          if (!Number.isFinite(n)) {
            throw new Error(`${def.label} must be a valid number.`);
          }
          attrs[def.attribute_key] = n;
          break;
        }

        case "boolean":
          attrs[def.attribute_key] = Boolean(raw);
          break;

        case "date":
          attrs[def.attribute_key] = String(raw);
          break;

        case "enum":
          attrs[def.attribute_key] = raw;
          break;

        default:
          throw new Error(`Unsupported attribute type for ${def.label}.`);
      }
    }

    return attrs;
  }

  function buildLinePayload() {
    const item_id = lineForm.item_id.trim();
    const quantity = Number(lineForm.quantity_received);

    if (!selectedShipmentId) {
      throw new Error("Select a shipment before adding lines.");
    }

    if (!item_id) {
      throw new Error("Item is required.");
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new Error("Quantity received must be a positive number.");
    }

    const attributes = buildLineAttributesFromForm();

    return {
      item_id,
      quantity_received: quantity,
      attributes: attributes,
      received_at: lineForm.received_at.trim()
        ? toApiDatetime(lineForm.received_at)
        : null,
      notes: lineForm.notes.trim() ? lineForm.notes.trim() : null,
    };
  }

  async function handleShipmentSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSavingShipment(true);
      const payload = buildShipmentPayload();

      if (editingShipmentId) {
        await updateInboundShipment(editingShipmentId, payload);
        await reloadSelectedShipmentAndLines(editingShipmentId);
        setSuccess("Inbound shipment updated.");
      } else {
        const res = await createInboundShipment(payload);
        await reloadShipments();
        if (res?.shipment?.id) {
          setSelectedShipmentId(res.shipment.id);
          await reloadSelectedShipmentAndLines(res.shipment.id);
        }
        setSuccess("Inbound shipment created.");
      }

      resetShipmentForm();
    } catch (err: any) {
      setError(err?.message || "Failed to save inbound shipment");
    } finally {
      setSavingShipment(false);
    }
  }

  async function handleLineSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (!selectedShipmentId) {
        throw new Error("Select a shipment first.");
      }

      if (!selectedShipment || selectedShipment.status !== "open") {
        throw new Error("Only open shipments can have lines added or edited.");
      }

      setSavingLine(true);
      const payload = buildLinePayload();

      if (editingLineId) {
        await updateInboundShipmentLine(editingLineId, {
          quantity_received: payload.quantity_received,
          attributes: payload.attributes,
          received_at: payload.received_at,
          notes: payload.notes,
        });

        await reloadSelectedShipmentAndLines(selectedShipmentId);
        setSuccess("Shipment line updated.");
      } else {
        const res = await createInboundShipmentLine(
          selectedShipmentId,
          payload,
        );

        const refreshedLines =
          await reloadSelectedShipmentAndLines(selectedShipmentId);

        const createdLine =
          refreshedLines.find((line) => line.id === res.line.id) || null;

        if (createdLine) {
          startReceiveLine(createdLine);
        }

        setSuccess("Shipment line created.");
      }

      resetLineForm();
    } catch (err: any) {
      setError(err?.message || "Failed to save shipment line");
    } finally {
      setSavingLine(false);
    }
  }

  async function handleMoveSubmit(line: InboundShipmentLine) {
    setError(null);
    setSuccess(null);

    try {
      if (!selectedShipmentId) {
        throw new Error("No shipment selected.");
      }

      if (!moveForm.to_inbound_shipment_id) {
        throw new Error("Destination shipment is required.");
      }

      if (moveForm.to_inbound_shipment_id === line.inbound_shipment_id) {
        throw new Error("Line is already assigned to that shipment.");
      }

      setSavingMove(true);

      await moveInboundShipmentLine(line.id, {
        to_inbound_shipment_id: moveForm.to_inbound_shipment_id,
        reason: moveForm.reason.trim() ? moveForm.reason.trim() : null,
      });

      await reloadShipments();
      await reloadSelectedShipmentAndLines(selectedShipmentId);

      resetMoveForm();
      setSuccess("Shipment line moved successfully.");
    } catch (err: any) {
      setError(err?.message || "Failed to move shipment line");
    } finally {
      setSavingMove(false);
    }
  }

  async function handleReceiveSubmit(line: InboundShipmentLine) {
    setError(null);
    setSuccess(null);

    try {
      if (!selectedShipmentId) {
        throw new Error("No shipment selected.");
      }

      if (!selectedShipment || selectedShipment.status !== "open") {
        throw new Error("Only open shipments can receive inventory.");
      }

      if (!receiveForm.location_id) {
        throw new Error("Location is required.");
      }

      const qty = Number(receiveForm.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw new Error("Quantity to receive must be a positive number.");
      }

      const remaining = Number(line.quantity_remaining ?? 0);
      if (qty > remaining) {
        throw new Error(
          `Quantity exceeds remaining amount on line (${remaining}).`,
        );
      }

      setSavingReceive(true);

      await receiveInventory({
        inbound_shipment_line_id: line.id,
        location_id: receiveForm.location_id,
        quantity: qty,
        visibility_tier: Number(receiveForm.visibility_tier),
        reason: receiveForm.reason.trim()
          ? receiveForm.reason.trim()
          : undefined,
        received_at: new Date().toISOString(),
      });

      const refreshedLines =
        await reloadSelectedShipmentAndLines(selectedShipmentId);
      const refreshedLine = refreshedLines.find((x) => x.id === line.id);

      setSuccess("Inventory received successfully.");

      if (
        !refreshedLine ||
        Number(refreshedLine.quantity_remaining ?? 0) <= 0
      ) {
        setReceivingLineId(null);
        setReceiveForm({
          lineId: "",
          location_id: "",
          quantity: "",
          visibility_tier: "3",
          reason: "",
        });
      } else {
        setReceiveForm((prev) => ({
          ...prev,
          quantity: String(refreshedLine.quantity_remaining),
          reason: "",
        }));
      }
    } catch (err: any) {
      setError(err?.message || "Failed to receive inventory");
    } finally {
      setSavingReceive(false);
    }
  }

  if (loading) {
    return (
      <div className={`page__wrapper ${styles.page}`}>
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading inbound shipments…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <div className={styles.breadcrumb}>
            <Link to="/">Home</Link> / Inbound Shipments
          </div>
          <h1 className={styles.title}>Inbound Shipments</h1>
          <p className={styles.subtitle}>
            Create declaration-linked shipments, record discovered contents, and
            send shipment lines to receiving.
          </p>
        </div>

        <div className={styles.headerActions}>
          <Link to="/admin/declarations" className="secondary-button">
            Manage Declarations
          </Link>
          <Link to="/admin/donors" className="secondary-button">
            Manage Donors
          </Link>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.layout}>
        <section className="panel">
          <div className="panel-header">
            <h2>{editingShipmentId ? "Edit Shipment" : "New Shipment"}</h2>
          </div>

          <form className={styles.form} onSubmit={handleShipmentSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Shipment Number</label>
                <input
                  value={shipmentForm.shipment_number}
                  onChange={(e) =>
                    setShipmentForm((prev) => ({
                      ...prev,
                      shipment_number: e.target.value,
                    }))
                  }
                  placeholder="e.g. INB-2026-001"
                  disabled={savingShipment}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  value={shipmentForm.status}
                  onChange={(e) =>
                    setShipmentForm((prev) => ({
                      ...prev,
                      status: e.target.value as InboundShipmentStatus,
                    }))
                  }
                  disabled={savingShipment}
                >
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group span-2">
                <label>Declaration</label>
                <select
                  value={shipmentForm.declaration_id}
                  onChange={(e) =>
                    setShipmentForm((prev) => ({
                      ...prev,
                      declaration_id: e.target.value,
                    }))
                  }
                  disabled={savingShipment}
                >
                  <option value="">Select declaration</option>
                  {declarations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.declaration_number}
                      {item.donor?.display_name
                        ? ` — ${item.donor.display_name}`
                        : ""}
                      {item.is_undeclared ? " (Undeclared)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Received At</label>
                <input
                  type="datetime-local"
                  value={shipmentForm.received_at}
                  onChange={(e) =>
                    setShipmentForm((prev) => ({
                      ...prev,
                      received_at: e.target.value,
                    }))
                  }
                  disabled={savingShipment}
                />
              </div>

              <div className="form-group span-2">
                <label>Notes</label>
                <textarea
                  rows={4}
                  value={shipmentForm.notes}
                  onChange={(e) =>
                    setShipmentForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  disabled={savingShipment}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className="secondary-button"
                onClick={resetShipmentForm}
                disabled={savingShipment}
              >
                {editingShipmentId ? "Cancel Edit" : "Clear"}
              </button>

              <button
                type="submit"
                className="app-button"
                disabled={savingShipment}
              >
                {savingShipment
                  ? editingShipmentId
                    ? "Saving..."
                    : "Creating..."
                  : editingShipmentId
                    ? "Save Changes"
                    : "Create Shipment"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Shipments</h2>
          </div>

          <div className={styles.toolbar}>
            <div className="filter-group search">
              <label>Search</label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search shipment, declaration, donor..."
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Declaration</label>
              <select
                value={declarationFilter}
                onChange={(e) => setDeclarationFilter(e.target.value)}
              >
                <option value="">All declarations</option>
                {declarations.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.declaration_number}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.summary}>
              {filteredShipments.length} / {shipments.length} shown
            </div>
          </div>

          {filteredShipments.length === 0 ? (
            <div className="table-section--empty">
              No inbound shipments found.
            </div>
          ) : (
            <div className={styles.tableWrap}>
              <table className="shipments-table">
                <thead>
                  <tr>
                    <th>Shipment</th>
                    <th>Declaration</th>
                    <th>Donor</th>
                    <th>Status</th>
                    <th>Received At</th>
                    <th>Lines</th>
                    <th>Qty</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map((item) => (
                    <tr
                      key={item.id}
                      className={
                        selectedShipmentId === item.id
                          ? styles.selectedRow
                          : undefined
                      }
                    >
                      <td>
                        <div className={styles.primaryCell}>
                          {item.shipment_number}
                        </div>
                        {item.notes ? (
                          <div className={styles.secondaryCell}>
                            {item.notes}
                          </div>
                        ) : null}
                      </td>
                      <td>
                        <div>{item.declaration_number}</div>
                        <div className={styles.secondaryCell}>
                          {item.declaration_is_undeclared
                            ? "Undeclared"
                            : "Declared"}
                        </div>
                      </td>
                      <td>{item.donor_display_name || "—"}</td>
                      <td>
                        <span
                          className={`shipment-status ${
                            item.status === "open"
                              ? styles.statusOpen
                              : item.status === "closed"
                                ? styles.statusClosed
                                : styles.statusCancelled
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td>{formatDateTime(item.received_at)}</td>
                      <td>{item.line_count}</td>
                      <td>{item.received_quantity}</td>
                      <td>
                        <div className="actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => selectShipment(item)}
                          >
                            View Lines
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => startEditShipment(item)}
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <div className={styles.bottomSection} id="shipmentLinesEditor">
        <section className="panel">
          <div className="panel-header">
            <h2>
              {selectedShipment
                ? `Shipment Lines — ${selectedShipment.shipment_number}`
                : "Shipment Lines"}
            </h2>
          </div>

          {!selectedShipment ? (
            <div className="table-section--empty">
              Select a shipment to view or manage its lines.
            </div>
          ) : (
            <>
              <div className={styles.shipmentMeta}>
                <div className={styles.metaCard}>
                  <strong>Declaration</strong>
                  <div>{selectedShipment.declaration_number}</div>
                </div>
                <div className={styles.metaCard}>
                  <strong>Donor</strong>
                  <div>{selectedShipment.donor_display_name || "—"}</div>
                </div>
                <div className={styles.metaCard}>
                  <strong>Status</strong>
                  <div>{selectedShipment.status}</div>
                </div>
                <div className={styles.metaCard}>
                  <strong>Received</strong>
                  <div>{formatDateTime(selectedShipment.received_at)}</div>
                </div>
              </div>

              {selectedShipment.status !== "open" && (
                <div className="form-help">
                  This shipment is <strong>{selectedShipment.status}</strong>.
                  Lines can be viewed, but only open shipments should be edited.
                </div>
              )}

              <div className={styles.linesLayout}>
                <div className={styles.lineFormPanel}>
                  <form className={styles.form} onSubmit={handleLineSubmit}>
                    <div className="form-grid">
                      <div className="form-group span-2">
                        <label>Item</label>
                        <select
                          value={lineForm.item_id}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              item_id: e.target.value,
                            }))
                          }
                          disabled={
                            savingLine ||
                            Boolean(editingLineId) ||
                            !canEditSelectedShipment
                          }
                        >
                          <option value="">Select item</option>
                          {items.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                              {item.category?.path?.length
                                ? ` (${item.category.path.join(" / ")})`
                                : ""}
                            </option>
                          ))}
                        </select>
                        {editingLineId && (
                          <div className={styles.fieldHelp}>
                            Item cannot be changed during line edit with the
                            current API.
                          </div>
                        )}
                      </div>

                      <div className="form-group">
                        <label>Quantity Received</label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={lineForm.quantity_received}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              quantity_received: e.target.value,
                            }))
                          }
                          disabled={savingLine || !canEditSelectedShipment}
                        />
                      </div>

                      <div className="form-group">
                        <label>Received At</label>
                        <input
                          type="datetime-local"
                          value={lineForm.received_at}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              received_at: e.target.value,
                            }))
                          }
                          disabled={savingLine || !canEditSelectedShipment}
                        />
                      </div>

                      <div className="form-group span-2">
                        <label>Item Attributes</label>

                        {lineAttributeDefs.length === 0 ? (
                          <div className="form-help">
                            This item has no defined attributes.
                          </div>
                        ) : (
                          <div className="form-grid">
                            {lineAttributeDefs.map((def) => (
                              <div className="form-group" key={def.id}>
                                <label>
                                  {def.label}
                                  {def.is_required ? " *" : ""}
                                </label>

                                {def.data_type === "text" && (
                                  <input
                                    type="text"
                                    value={String(
                                      lineAttributeValues[def.attribute_key] ??
                                        "",
                                    )}
                                    onChange={(e) =>
                                      setLineAttributeValues((prev) => ({
                                        ...prev,
                                        [def.attribute_key]: e.target.value,
                                      }))
                                    }
                                    disabled={
                                      savingLine || !canEditSelectedShipment
                                    }
                                  />
                                )}

                                {def.data_type === "number" && (
                                  <input
                                    type="number"
                                    step="any"
                                    value={String(
                                      lineAttributeValues[def.attribute_key] ??
                                        "",
                                    )}
                                    onChange={(e) =>
                                      setLineAttributeValues((prev) => ({
                                        ...prev,
                                        [def.attribute_key]: e.target.value,
                                      }))
                                    }
                                    disabled={
                                      savingLine || !canEditSelectedShipment
                                    }
                                  />
                                )}

                                {def.data_type === "date" && (
                                  <input
                                    type="date"
                                    value={String(
                                      lineAttributeValues[def.attribute_key] ??
                                        "",
                                    )}
                                    onChange={(e) =>
                                      setLineAttributeValues((prev) => ({
                                        ...prev,
                                        [def.attribute_key]: e.target.value,
                                      }))
                                    }
                                    disabled={
                                      savingLine || !canEditSelectedShipment
                                    }
                                  />
                                )}

                                {def.data_type === "boolean" && (
                                  <label className="checkbox-field">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(
                                        lineAttributeValues[def.attribute_key],
                                      )}
                                      onChange={(e) =>
                                        setLineAttributeValues((prev) => ({
                                          ...prev,
                                          [def.attribute_key]: e.target.checked,
                                        }))
                                      }
                                      disabled={
                                        savingLine || !canEditSelectedShipment
                                      }
                                    />
                                    <span>Yes</span>
                                  </label>
                                )}

                                {def.data_type === "enum" && (
                                  <select
                                    value={String(
                                      lineAttributeValues[def.attribute_key] ??
                                        "",
                                    )}
                                    onChange={(e) =>
                                      setLineAttributeValues((prev) => ({
                                        ...prev,
                                        [def.attribute_key]: e.target.value,
                                      }))
                                    }
                                    disabled={
                                      savingLine || !canEditSelectedShipment
                                    }
                                  >
                                    <option value="">Select</option>
                                    {(Array.isArray(def.allowed_values)
                                      ? def.allowed_values
                                      : []
                                    ).map((v) => (
                                      <option key={String(v)} value={String(v)}>
                                        {String(v)}
                                      </option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="form-group span-2">
                        <label>Notes</label>
                        <textarea
                          rows={4}
                          value={lineForm.notes}
                          onChange={(e) =>
                            setLineForm((prev) => ({
                              ...prev,
                              notes: e.target.value,
                            }))
                          }
                          disabled={savingLine || !canEditSelectedShipment}
                        />
                      </div>
                    </div>

                    <div className={styles.formActions}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={resetLineForm}
                        disabled={savingLine}
                      >
                        {editingLineId ? "Cancel Edit" : "Clear"}
                      </button>

                      <button
                        type="submit"
                        className="app-button"
                        disabled={
                          savingLine ||
                          !selectedShipmentId ||
                          !canEditSelectedShipment
                        }
                      >
                        {savingLine
                          ? editingLineId
                            ? "Saving..."
                            : "Adding..."
                          : editingLineId
                            ? "Save Line"
                            : "Add Line"}
                      </button>
                    </div>
                  </form>
                </div>

                <div className={styles.lineTablePanel}>
                  {lines.length === 0 ? (
                    <div className="table-section--empty">
                      This shipment has no lines yet. Add the first discovered
                      item using the form on the left.
                    </div>
                  ) : (
                    <div className={styles.tableWrap}>
                      <table className="shipments-table">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Quantity Received</th>
                            <th>Quantity Assigned</th>
                            <th>Quantity Remaining</th>
                            <th>Received At</th>
                            <th>Attributes</th>
                            <th>Notes</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lines.map((line) => (
                            <React.Fragment key={line.id}>
                              <tr
                                className={
                                  Number(line.quantity_remaining ?? 0) > 0
                                    ? styles.pendingRow
                                    : styles.completeRow
                                }
                              >
                                <td>{line.item_name || line.item_id}</td>
                                <td>{line.quantity_received}</td>
                                <td>{line.quantity_assigned}</td>
                                <td
                                  className={`${styles.remainingCell} ${
                                    Number(line.quantity_remaining ?? 0) > 0
                                      ? styles.remainingPositive
                                      : styles.remainingZero
                                  }`}
                                >
                                  {line.quantity_remaining}
                                </td>{" "}
                                <td>{formatDateTime(line.received_at)}</td>
                                <td>
                                  <pre className={styles.jsonBlock}>
                                    {stringifyAttributes(line.attributes)}
                                  </pre>
                                </td>
                                <td>{line.notes || "—"}</td>
                                <td>
                                  <div className="actions">
                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() => startEditLine(line)}
                                      disabled={!canEditSelectedShipment}
                                    >
                                      Edit
                                    </button>

                                    <button
                                      type="button"
                                      className="secondary-button"
                                      onClick={() => startMoveLine(line)}
                                      disabled={!canEditSelectedShipment}
                                    >
                                      Move
                                    </button>

                                    <button
                                      type="button"
                                      className="app-button"
                                      onClick={() => startReceiveLine(line)}
                                      disabled={line?.is_fully_received}
                                    >
                                      Receive
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {movingLineId === line.id && (
                                <tr>
                                  <td colSpan={8}>
                                    <div className={styles.inlineReceivePanel}>
                                      <div className="form-grid">
                                        <div className="form-group span-2">
                                          <label>Move to Shipment</label>
                                          <select
                                            value={
                                              moveForm.to_inbound_shipment_id
                                            }
                                            onChange={(e) =>
                                              setMoveForm((prev) => ({
                                                ...prev,
                                                to_inbound_shipment_id:
                                                  e.target.value,
                                              }))
                                            }
                                            disabled={savingMove}
                                          >
                                            <option value="">
                                              Select destination shipment
                                            </option>
                                            {shipments
                                              .filter(
                                                (shipment) =>
                                                  shipment.id !==
                                                    line.inbound_shipment_id &&
                                                  shipment.status === "open",
                                                // shipment.declaration_id ===
                                                //   selectedShipment?.declaration_id,
                                              )
                                              .map((shipment) => (
                                                <option
                                                  key={shipment.id}
                                                  value={shipment.id}
                                                >
                                                  {shipment.shipment_number}
                                                  {shipment.donor_display_name
                                                    ? ` — ${shipment.donor_display_name}`
                                                    : ""}
                                                </option>
                                              ))}
                                          </select>
                                        </div>

                                        <div className="form-group span-2">
                                          <label>Reason</label>
                                          <input
                                            value={moveForm.reason}
                                            onChange={(e) =>
                                              setMoveForm((prev) => ({
                                                ...prev,
                                                reason: e.target.value,
                                              }))
                                            }
                                            disabled={savingMove}
                                            placeholder="Wrong shipment selected, intake correction, etc."
                                          />
                                        </div>
                                      </div>

                                      <div className={styles.formActions}>
                                        <button
                                          type="button"
                                          className="secondary-button"
                                          onClick={resetMoveForm}
                                          disabled={savingMove}
                                        >
                                          Cancel
                                        </button>

                                        <button
                                          type="button"
                                          className="app-button"
                                          onClick={() => handleMoveSubmit(line)}
                                          disabled={savingMove}
                                        >
                                          {savingMove
                                            ? "Moving..."
                                            : "Confirm Move"}
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}

                              {receivingLineId === line.id && (
                                <tr>
                                  <td colSpan={8}>
                                    <div className={styles.inlineReceivePanel}>
                                      <div className="form-grid">
                                        <div className="form-group span-2">
                                          <label>Location</label>
                                          <select
                                            value={receiveForm.location_id}
                                            onChange={(e) =>
                                              setReceiveForm((prev) => ({
                                                ...prev,
                                                location_id: e.target.value,
                                              }))
                                            }
                                            disabled={savingReceive}
                                          >
                                            <option value="">
                                              Select location
                                            </option>
                                            {locations
                                              .filter(
                                                (loc) =>
                                                  loc.is_active !== false,
                                              )
                                              .map((loc) => (
                                                <option
                                                  key={loc.id}
                                                  value={loc.id}
                                                >
                                                  {formatPath(loc.path)}
                                                </option>
                                              ))}
                                          </select>
                                        </div>

                                        <div className="form-group">
                                          <label>Quantity to Receive</label>
                                          <input
                                            type="number"
                                            min="0"
                                            step="1"
                                            value={receiveForm.quantity}
                                            onChange={(e) =>
                                              setReceiveForm((prev) => ({
                                                ...prev,
                                                quantity: e.target.value,
                                              }))
                                            }
                                            disabled={savingReceive}
                                          />
                                        </div>

                                        <div className="form-group">
                                          <label>Visibility Tier</label>
                                          <select
                                            value={receiveForm.visibility_tier}
                                            onChange={(e) =>
                                              setReceiveForm((prev) => ({
                                                ...prev,
                                                visibility_tier: e.target.value,
                                              }))
                                            }
                                            disabled={savingReceive}
                                          >
                                            <option value="1">
                                              1 — Aequitas only
                                            </option>
                                            <option value="2">
                                              2 — Trusted people
                                            </option>
                                            <option value="3">
                                              3 — Everyone
                                            </option>
                                          </select>
                                        </div>

                                        <div className="form-group span-2">
                                          <label>Reason</label>
                                          <input
                                            value={receiveForm.reason}
                                            onChange={(e) =>
                                              setReceiveForm((prev) => ({
                                                ...prev,
                                                reason: e.target.value,
                                              }))
                                            }
                                            disabled={savingReceive}
                                          />
                                        </div>

                                        <div className="form-group span-2">
                                          <label>Inbound Line Attributes</label>
                                          <pre className={styles.jsonBlock}>
                                            {JSON.stringify(
                                              line.attributes ?? {},
                                              null,
                                              2,
                                            )}
                                          </pre>
                                        </div>
                                      </div>

                                      <div className={styles.formActions}>
                                        <button
                                          type="button"
                                          className="secondary-button"
                                          onClick={() =>
                                            setReceivingLineId(null)
                                          }
                                          disabled={savingReceive}
                                        >
                                          Cancel
                                        </button>

                                        <button
                                          type="button"
                                          className="app-button"
                                          onClick={() =>
                                            handleReceiveSubmit(line)
                                          }
                                          disabled={savingReceive}
                                        >
                                          {savingReceive
                                            ? "Receiving..."
                                            : "Confirm Receive"}
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
