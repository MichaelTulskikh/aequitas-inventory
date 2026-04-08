import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { getMyRequesterProfile } from "../api/requesterProfile";

type RequesterProfile = {
  id: string;
  full_name: string | null;
  signing_representative_name: string | null;
  edrpou: string | null;
  phone: string | null;
  email: string | null;
  official_address: string | null;
  delivery_address: string | null;
};

function isProfileComplete(profile: RequesterProfile | null) {
  if (!profile) return false;

  return [
    profile.full_name,
    profile.signing_representative_name,
    profile.edrpou,
    profile.phone,
    profile.email,
    profile.official_address,
    profile.delivery_address,
  ].every((v) => !!String(v || "").trim());
}

export function RequireCompleteProfile({
  children,
}: {
  children: ReactNode;
}) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkProfile() {
      try {
        const result = await getMyRequesterProfile();
        if (cancelled) return;

        setIsComplete(isProfileComplete(result.profile ?? null));
      } catch {
        if (cancelled) return;
        setIsComplete(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!isComplete) {
    return (
      <Navigate
        to="/profile"
        replace
        state={{
          profileRequiredMessage:
            "Please complete your profile before accessing this page.",
          from: location.pathname,
        }}
      />
    );
  }

  return <>{children}</>;
}