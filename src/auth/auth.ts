const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const REDIRECT_URI = import.meta.env.VITE_COGNITO_REDIRECT_URI;
const LOGOUT_URI = import.meta.env.VITE_COGNITO_LOGOUT_URI;

// const REDIRECT_URI = "http://localhost:5173/auth/callback";
// const LOGOUT_URI = "http://localhost:5173/"

const TOKEN_ENDPOINT = `${COGNITO_DOMAIN}/oauth2/token`;

// PKCE helpers -- necessary TODO: do more research on this

function base64UrlEncode(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sha256(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

function generateCodeVerifier(): string {
  return crypto.randomUUID() + crypto.randomUUID();
}

// Login
export async function login(): Promise<void> {
  sessionStorage.setItem("post_login_redirect", window.location.pathname);
  sessionStorage.setItem("auth_in_progress", "1");


  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await sha256(codeVerifier);

  // Save verifier for callback
  localStorage.setItem("pkce_verifier", codeVerifier);

  const url =
    `${COGNITO_DOMAIN}/login` +
    `?response_type=code` +
    `&client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&scope=openid+email+profile` +
    `&code_challenge=${codeChallenge}` +
    `&code_challenge_method=S256`;

  window.location.href = url;
}

// Handle redirect + exchange

export async function handleAuthRedirect(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");

  // No code -> nothing to do
  if (!code) return;

  // Prevent double-exchange (per redirect only)
  if (sessionStorage.getItem("oauth_code_used")) {
    return;
  }
  sessionStorage.setItem("oauth_code_used", "1");

  const codeVerifier = localStorage.getItem("pkce_verifier");
  if (!codeVerifier) {
    throw new Error("Missing PKCE code verifier");
  }

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: CLIENT_ID,
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: codeVerifier,
  });

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    throw new Error(await resp.text());
  }

  const data = await resp.json();

  localStorage.setItem("id_token", data.id_token);
  localStorage.setItem("access_token", data.access_token);

  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }

  // !! Necessary cleanup
  localStorage.removeItem("pkce_verifier");
  sessionStorage.removeItem("oauth_code_used");
  sessionStorage.removeItem("auth_in_progress");

  // Clean URL
  window.history.replaceState({}, "", "/");
}

// Refresh Access Token
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  });

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    return null;
  }

  const data = await resp.json();

  localStorage.setItem("access_token", data.access_token);
  if (data.refresh_token) {
    localStorage.setItem("refresh_token", data.refresh_token);
  }

  return data.access_token;
}

// Logout

export function logout(): void {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("id_token");
  sessionStorage.clear();

  const url =
    `${COGNITO_DOMAIN}/logout` +
    `?client_id=${CLIENT_ID}` +
    `&logout_uri=${encodeURIComponent(LOGOUT_URI)}`;

  window.location.href = url;
}


// Token Helpers

export function getIdToken(): string | null {
  return localStorage.getItem("id_token");
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refresh_token");
}