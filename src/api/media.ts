import { apiFetch } from "./client";

export type MediaImage = {
  id: string;
  caption: string | null;
  is_primary: boolean;
  created_at: string;
  url: string | null;
  s3_key: string;
};

export async function uploadFileToPresignedUrl(
  file: File,
  uploadUrl: string,
): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!res.ok) {
    throw new Error(`Failed to upload file (${res.status})`);
  }
}

export async function getItemImages(itemId: string): Promise<{ images: MediaImage[] }> {
  return apiFetch(`/v2/item-catalog/items/${itemId}/images`);
}

export async function requestItemImageUploadUrl(
  itemId: string,
  body: { filename: string; content_type: string },
): Promise<{ upload_url: string; s3_key: string }> {
  return apiFetch(`/v2/item-catalog/items/${itemId}/images/upload-url`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function attachItemImage(
  itemId: string,
  body: {
    s3_key: string;
    caption?: string | null;
    is_primary?: boolean;
  },
): Promise<{ image: MediaImage }> {
  return apiFetch(`/v2/item-catalog/items/${itemId}/images`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function getLotImages(lotId: string): Promise<{ images: MediaImage[] }> {
  return apiFetch(`/v2/inventory/lots/${lotId}/images`);
}

export async function requestLotImageUploadUrl(
  lotId: string,
  body: { filename: string; content_type: string },
): Promise<{ upload_url: string; s3_key: string }> {
  return apiFetch(`/v2/inventory/lots/${lotId}/images/upload-url`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function attachLotImage(
  lotId: string,
  body: {
    s3_key: string;
    caption?: string | null;
    is_primary?: boolean;
  },
): Promise<{ image: MediaImage }> {
  return apiFetch(`/v2/inventory/lots/${lotId}/images`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}