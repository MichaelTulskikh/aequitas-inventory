import { getAccessToken, refreshAccessToken, logout} from "../auth/auth";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function apiFetch(path: string, options: RequestInit = {}) {
  let token = getAccessToken();

  let res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    token = await refreshAccessToken();

    if (!token) {
      logout();
      throw new Error("Unauthorized");
    }

    res = await fetch(`${API_BASE}/api${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });

  }

  if (!res.ok) {
    const text = await res.text();
    console.log("[API]", path, res.status, text);
    throw new Error(text);
  }

  return res.json();
}

type InventoryParams = {
  q?: string;
  types?: string;        // category filter
  pallets?: string;
  boxes?: string;
  min_on_hand?: number;
  page?: number;
  page_size?: number;
};

export function fetchInventory(params: InventoryParams = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  });

  const qs = search.toString();
  return apiFetch(`/inventory${qs ? `?${qs}` : ""}`);
}

export function fetchMyRequests() {
  return apiFetch(`/requests`, {
    method: "POST",
  });
}