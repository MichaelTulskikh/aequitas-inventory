import {
  getAccessToken,
  refreshAccessToken,
  logout,
  getIdToken,
} from "../auth/auth";
import { emitError, emitToast } from "../utils/errorBus";

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof (value as { message: unknown }).message === "string"
  );
}

function hasError(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

const API_BASE = import.meta.env.VITE_API_BASE;

let refreshPromise: Promise<string | null> | null = null;
type TApiResponse = {
  message?: string;
  error?: string;
};
async function getFreshToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessToken().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const makeRequest = async (token?: string | null) => {
    const id_token = getIdToken();

    return fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(id_token && { "X-ID-Token": id_token }),
        ...(options?.headers ?? {}),
      },
    });
  };
  let token = getAccessToken();

  let res = await makeRequest(token);

  if (res.status === 401) {
    token = await getFreshToken();
    console.log("EXISTS", !!token, token);

    if (!token) {
      logout();
      throw new Error("Unauthorized");
    }

    res = await makeRequest(token);
  }

  let data: TApiResponse | null = null;
  const contentType = res.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    data = await res.json();
  }

  if (!res.ok) {
    const message = hasMessage(data)
      ? data.message
      : hasError(data)
        ? data.error
        : `Request failed (${res.status})`;

    console.log("[API]", path, res.status, message);
    emitError(message);
    throw new Error(message);
  }

  // success toast support
  if (hasMessage(data)) {
    emitToast(data.message, "success");
  }

  return data as T;
}
