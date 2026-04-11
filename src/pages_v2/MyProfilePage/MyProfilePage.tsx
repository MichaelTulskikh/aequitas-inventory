import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  getMyRequesterProfile,
  upsertMyRequesterProfile,
} from "../../api/requesterProfile";
import styles from "./MyProfilePage.module.css";

type ProfileLocationState = {
  profileRequiredMessage?: string;
  from?: string;
};

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

export default function MyProfilePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const navState = (location.state as ProfileLocationState | null) ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [profileId, setProfileId] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [signingRepresentativeName, setSigningRepresentativeName] =
    useState("");
  const [edrpou, setEdrpou] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [officialAddress, setOfficialAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");

  const profilePreview: RequesterProfile = useMemo(
    () => ({
      id: profileId || "",
      full_name: fullName || null,
      signing_representative_name: signingRepresentativeName || null,
      edrpou: edrpou || null,
      phone: phone || null,
      email: email || null,
      official_address: officialAddress || null,
      delivery_address: deliveryAddress || null,
    }),
    [
      profileId,
      fullName,
      signingRepresentativeName,
      edrpou,
      phone,
      email,
      officialAddress,
      deliveryAddress,
    ],
  );

  const complete = isProfileComplete(profilePreview);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);

        const result = await getMyRequesterProfile();

        if (cancelled) return;

        const profile = result.profile;
        if (profile) {
          setProfileId(profile.id);
          setFullName(profile.full_name || "");
          setSigningRepresentativeName(
            profile.signing_representative_name || "",
          );
          setEdrpou(profile.edrpou || "");
          setPhone(profile.phone || "");
          setEmail(profile.email || "");
          setOfficialAddress(profile.official_address || "");
          setDeliveryAddress(profile.delivery_address || "");
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || "Failed to load profile");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!navState?.profileRequiredMessage) return;

    setError(navState.profileRequiredMessage);
    setSuccess(null);

    const timer = window.setTimeout(() => {
      setError((current) =>
        current === navState.profileRequiredMessage ? null : current,
      );
    }, 4000);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });

    return () => window.clearTimeout(timer);
  }, [navState?.profileRequiredMessage, navigate, location.pathname]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setSaving(true);

      const result = await upsertMyRequesterProfile({
        full_name: fullName || null,
        signing_representative_name: signingRepresentativeName || null,
        edrpou: edrpou || null,
        phone: phone || null,
        email: email || null,
        official_address: officialAddress || null,
        delivery_address: deliveryAddress || null,
      });

      setProfileId(result.profile.id);
      setSuccess("Profile saved.");
    } catch (err: any) {
      setError(err?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className={`page-shell ${styles.page}`}>
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page-shell ${styles.page}`}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>My Profile</h1>
          <p className={styles.subtitle}>
            Maintain requester information used for shipment creation and
            submission.
          </p>
        </div>
      </div>

      {error && <div className="alert-error">Error: {error}</div>}
      {success && <div className="alert-success">{success}</div>}

      <div className={styles.layout}>
        <section className="panel">
          <div className="panel-header">
            <h2>Requester Profile</h2>
          </div>

          <form className={styles.form} onSubmit={handleSave}>
            <div className="my-profile-grid">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={saving}
                  placeholder="Organization, NGO, military unit, or individual"
                />
              </div>

              <div className="form-group">
                <label>Signing Representative Name</label>
                <input
                  value={signingRepresentativeName}
                  onChange={(e) => setSigningRepresentativeName(e.target.value)}
                  disabled={saving}
                  placeholder="Authorized representative"
                />
              </div>

              <div className="form-group">
                <label>EDRPOU</label>
                <input
                  value={edrpou}
                  onChange={(e) => setEdrpou(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={saving}
                  type="email"
                />
              </div>

              <div className="form-group span-2">
                <label>Official Address</label>
                <textarea
                  rows={3}
                  value={officialAddress}
                  onChange={(e) => setOfficialAddress(e.target.value)}
                  disabled={saving}
                />
              </div>

              <div className="form-group span-2">
                <label>Delivery Address</label>
                <textarea
                  rows={3}
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="app-button" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Completeness</h2>
          </div>

          <div
            className={`${styles.completeness} ${
              complete ? styles.complete : styles.incomplete
            }`}
          >
            {complete ? "Profile complete" : "Profile incomplete"}
          </div>

          <div className={styles.checklist}>
            <div className={fullName.trim() ? styles.done : ""}>Full Name</div>
            <div className={signingRepresentativeName.trim() ? styles.done : ""}>
              Signing Representative Name
            </div>
            <div className={edrpou.trim() ? styles.done : ""}>EDRPOU</div>
            <div className={phone.trim() ? styles.done : ""}>Phone</div>
            <div className={email.trim() ? styles.done : ""}>Email</div>
            <div className={officialAddress.trim() ? styles.done : ""}>
              Official Address
            </div>
            <div className={deliveryAddress.trim() ? styles.done : ""}>
              Delivery Address
            </div>
          </div>

          <div className="form-help">
            Shipment submission should be blocked until all required fields are
            filled.
          </div>
        </section>
      </div>
    </div>
  );
}
