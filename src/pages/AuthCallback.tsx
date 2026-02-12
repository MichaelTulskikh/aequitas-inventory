import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { handleAuthRedirect } from "../auth/auth";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    handleAuthRedirect()
      .then(() => {
        // SPA navigation
        navigate("/", { replace: true });
      })
      .catch((e) => {
        console.error("Auth callback failed", e);
      });
  }, [navigate]);

  return <div style={{ padding: 20 }}>Signing you in…</div>;
}
