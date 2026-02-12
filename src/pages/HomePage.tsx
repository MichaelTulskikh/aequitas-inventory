import { getIdToken } from "../auth/auth";

function parseJwt(token: string | null): any | null {
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

export default function HomePage() {
  const claims = parseJwt(getIdToken());

  return (
    <div>
      <h1>Welcome</h1>

      <p>You are signed in.</p>

      {claims && (
        <div style={{ marginTop: 16 }}>
          <h3>Account info</h3>
          <ul>
            <li><strong>Email:</strong> {claims.name}</li>
            <li><strong>User ID:</strong> {claims.sub}</li>
            <li><strong>Issuer:</strong> {claims.iss}</li>
          </ul>
        </div>
      )}
    </div>
  );
}
