import { apiFetch } from "./client";

export type InventoryTemplate = {
  item_id: string;
  item_name: string;
  default_unit: string;
  attributes: Record<string, string>;
};

export const fetchInventoryTemplates = () =>
  apiFetch("/inventory/templates");

export const receiveInventory = (payload: any) =>
  apiFetch("/inventory/receive", {
    method: "POST",
    body: JSON.stringify(payload)
  });

export const requestImageUpload = (lotId: string, contentType: string) =>
  apiFetch(`/inventory/lots/${lotId}/images`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ contentType })
  });

export const uploadToS3 = (url: string, file: File) =>
  fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file
  });

export async function fetchInventoryLotImages(lotId: string) {
  return apiFetch(`/inventory-lots/${lotId}/images`);
}
