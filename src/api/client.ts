import {
  getAccessToken,
  refreshAccessToken,
  logout,
  getIdToken,
} from "../auth/auth";
import { emitError, emitToast } from "../utils/errorBus";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function apiFetch(path: string, options: RequestInit = {}) {
  let token = getAccessToken();
  const id_token = getIdToken();

  let res = await fetch(`${API_BASE}/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(id_token ? { "X-ID-Token": id_token } : {}),
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

  let data: any = null;

  try {
    data = await res.json();
  } catch {
    // fallback if server returns plain text
  }

  if (!res.ok) {
    const message =
      data?.error ||
      data?.message ||
      `Request failed (${res.status})`;

    console.log("[API]", path, res.status, message);

    emitError(message);

    throw new Error(message);
  }

  // success toast support
  if (data?.message) {
    emitToast(data.message, "success");
  }

  return data;
}