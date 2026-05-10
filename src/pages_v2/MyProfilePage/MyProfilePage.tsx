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

type FieldErrors = {
  fullName?: string;
  signingRepresentativeName?: string;
  edrpou?: string;
  phone?: string;
  email?: string;
  officialAddress?: string;
  deliveryAddress?: string;
};

type TouchedFields = {
  fullName?: boolean;
  signingRepresentativeName?: boolean;
  edrpou?: boolean;
  phone?: boolean;
  email?: boolean;
  officialAddress?: boolean;
  deliveryAddress?: boolean;
};

function validateRequired(value: string, label: string): string {
  if (!value.trim()) return `${label} is required.`;
  return "";
}

function validateEdrpou(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) return "EDRPOU is required.";
  if (!/^\d{8}$/.test(trimmed)) return "EDRPOU must be exactly 8 digits.";

  return "";
}

function validateEmail(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) return "Email is required.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return "Enter a valid email address.";
  }

  return "";
}

function validatePhone(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) return "Phone is required.";
  if (!/^[\d+\-() ]{7,20}$/.test(trimmed)) {
    return "Enter a valid phone number.";
  }

  return "";
}

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

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  function getFieldError(field: keyof FieldErrors, value: string): string {
    switch (field) {
      case "fullName":
        return validateRequired(value, "Full Name");
      case "signingRepresentativeName":
        return validateRequired(value, "Signing Representative Name");
      case "edrpou":
        return validateEdrpou(value);
      case "phone":
        return validatePhone(value);
      case "email":
        return validateEmail(value);
      case "officialAddress":
        return validateRequired(value, "Official Address");
      case "deliveryAddress":
        return validateRequired(value, "Delivery Address");
      default:
        return "";
    }
  }

  function validateForm(): FieldErrors {
    return {
      fullName: validateRequired(fullName, "Full Name"),
      signingRepresentativeName: validateRequired(
        signingRepresentativeName,
        "Signing Representative Name",
      ),
      edrpou: validateEdrpou(edrpou),
      phone: validatePhone(phone),
      email: validateEmail(email),
      officialAddress: validateRequired(officialAddress, "Official Address"),
      deliveryAddress: validateRequired(deliveryAddress, "Delivery Address"),
    };
  }

  function hasErrors(errors: FieldErrors): boolean {
    return Object.values(errors).some(Boolean);
  }

  function markFieldTouched(field: keyof TouchedFields) {
    setTouched((prev) => ({ ...prev, [field]: true }));
  }

  function updateFieldError(field: keyof FieldErrors, value: string) {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: getFieldError(field, value),
    }));
  }

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

  const requiredItems = useMemo(
    () => [
      { label: "Full Name", done: !!fullName.trim() },
      {
        label: "Signing Representative Name",
        done: !!signingRepresentativeName.trim(),
      },
      { label: "EDRPOU", done: !!edrpou.trim() },
      { label: "Phone", done: !!phone.trim() },
      { label: "Email", done: !!email.trim() },
      { label: "Official Address", done: !!officialAddress.trim() },
      { label: "Delivery Address", done: !!deliveryAddress.trim() },
    ],
    [
      fullName,
      signingRepresentativeName,
      edrpou,
      phone,
      email,
      officialAddress,
      deliveryAddress,
    ],
  );

  const completedCount = requiredItems.filter((item) => item.done).length;
  const totalCount = requiredItems.length;
  const completionPercent = Math.round((completedCount / totalCount) * 100);
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

    const errors = validateForm();
    setFieldErrors(errors);
    setTouched({
      fullName: true,
      signingRepresentativeName: true,
      edrpou: true,
      phone: true,
      email: true,
      officialAddress: true,
      deliveryAddress: true,
    });

    if (hasErrors(errors)) {
      setError("Please correct the highlighted fields.");
      return;
    }

    try {
      setSaving(true);

      const result = await upsertMyRequesterProfile({
        full_name: fullName.trim() || null,
        signing_representative_name: signingRepresentativeName.trim() || null,
        edrpou: edrpou.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        official_address: officialAddress.trim() || null,
        delivery_address: deliveryAddress.trim() || null,
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
      <div className={`page__wrapper ${styles.page}`}>
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading profile…</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`page__wrapper ${styles.page}`}>
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

          <form className={styles.form} onSubmit={handleSave} noValidate>
            <div className={styles.formIntro}>
              Complete the required requester details below. This information is
              used when creating and submitting shipments.
            </div>

            <div className="my-profile-grid">
              <div className={`form-group ${styles.fieldGroup}`}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Full Name</label>
                  <span className={styles.fieldMeta}>Required</span>
                </div>
                <div className={styles.inputWrap}>
                  <input
                    value={fullName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setFullName(value);
                      if (touched.fullName) updateFieldError("fullName", value);
                    }}
                    onBlur={() => {
                      markFieldTouched("fullName");
                      updateFieldError("fullName", fullName);
                    }}
                    disabled={saving}
                    placeholder="Organization, NGO, military unit, or individual"
                    aria-invalid={!!(touched.fullName && fieldErrors.fullName)}
                    className={`${styles.input} ${
                      touched.fullName && fieldErrors.fullName
                        ? styles.inputInvalid
                        : ""
                    }`}
                  />
                </div>
                <div className={styles.fieldHint}>
                  Enter the legal name of the requester.
                </div>
                {touched.fullName && fieldErrors.fullName && (
                  <div className={styles.fieldError}>
                    {fieldErrors.fullName}
                  </div>
                )}
              </div>

              <div className={`form-group ${styles.fieldGroup}`}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>
                    Signing Representative Name
                  </label>
                  <span className={styles.fieldMeta}>Required</span>
                </div>
                <div className={styles.inputWrap}>
                  <input
                    value={signingRepresentativeName}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSigningRepresentativeName(value);
                      if (touched.signingRepresentativeName) {
                        updateFieldError("signingRepresentativeName", value);
                      }
                    }}
                    onBlur={() => {
                      markFieldTouched("signingRepresentativeName");
                      updateFieldError(
                        "signingRepresentativeName",
                        signingRepresentativeName,
                      );
                    }}
                    disabled={saving}
                    placeholder="Authorized representative"
                    aria-invalid={
                      !!(
                        touched.signingRepresentativeName &&
                        fieldErrors.signingRepresentativeName
                      )
                    }
                    className={`${styles.input} ${
                      touched.signingRepresentativeName &&
                      fieldErrors.signingRepresentativeName
                        ? styles.inputInvalid
                        : ""
                    }`}
                  />
                </div>
                <div className={styles.fieldHint}>
                  Person authorized to sign shipment requests.
                </div>
                {touched.signingRepresentativeName &&
                  fieldErrors.signingRepresentativeName && (
                    <div className={styles.fieldError}>
                      {fieldErrors.signingRepresentativeName}
                    </div>
                  )}
              </div>

              <div className={`form-group ${styles.fieldGroup}`}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>EDRPOU</label>
                  <span className={styles.fieldMeta}>8 digits</span>
                </div>
                <div className={styles.inputWrap}>
                  <input
                    value={edrpou}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 8);
                      setEdrpou(value);
                      if (touched.edrpou) updateFieldError("edrpou", value);
                    }}
                    onBlur={() => {
                      markFieldTouched("edrpou");
                      updateFieldError("edrpou", edrpou);
                    }}
                    disabled={saving}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Company or organization code"
                    aria-invalid={!!(touched.edrpou && fieldErrors.edrpou)}
                    className={`${styles.input} ${
                      touched.edrpou && fieldErrors.edrpou
                        ? styles.inputInvalid
                        : ""
                    }`}
                  />
                </div>
                <div className={styles.fieldHint}>EDRPOU / ЄДРПОУ</div>
                {touched.edrpou && fieldErrors.edrpou && (
                  <div className={styles.fieldError}>{fieldErrors.edrpou}</div>
                )}
              </div>

              <div className={`form-group ${styles.fieldGroup}`}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Phone</label>
                  <span className={styles.fieldMeta}>Required</span>
                </div>
                <div className={styles.inputWrap}>
                  <input
                    value={phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      setPhone(value);
                      if (touched.phone) updateFieldError("phone", value);
                    }}
                    onBlur={() => {
                      markFieldTouched("phone");
                      updateFieldError("phone", phone);
                    }}
                    disabled={saving}
                    placeholder="Primary contact number"
                    aria-invalid={!!(touched.phone && fieldErrors.phone)}
                    className={`${styles.input} ${
                      touched.phone && fieldErrors.phone
                        ? styles.inputInvalid
                        : ""
                    }`}
                  />
                </div>
                <div className={styles.fieldHint}>
                  Include country code when applicable.
                </div>
                {touched.phone && fieldErrors.phone && (
                  <div className={styles.fieldError}>{fieldErrors.phone}</div>
                )}
              </div>

              <div className={`form-group ${styles.fieldGroup}`}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Email</label>
                  <span className={styles.fieldMeta}>Required</span>
                </div>
                <div className={styles.inputWrap}>
                  <input
                    value={email}
                    onChange={(e) => {
                      const value = e.target.value;
                      setEmail(value);
                      if (touched.email) updateFieldError("email", value);
                    }}
                    onBlur={() => {
                      markFieldTouched("email");
                      updateFieldError("email", email);
                    }}
                    disabled={saving}
                    type="email"
                    placeholder="Primary contact email"
                    aria-invalid={!!(touched.email && fieldErrors.email)}
                    className={`${styles.input} ${
                      touched.email && fieldErrors.email
                        ? styles.inputInvalid
                        : ""
                    }`}
                  />
                </div>
                <div className={styles.fieldHint}>
                  Used for shipment communication and updates.
                </div>
                {touched.email && fieldErrors.email && (
                  <div className={styles.fieldError}>{fieldErrors.email}</div>
                )}
              </div>

              <div className={`form-group span-2 ${styles.fieldGroup}`}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Official Address</label>
                  <span className={styles.fieldMeta}>Required</span>
                </div>
                <div className={styles.inputWrap}>
                  <textarea
                    rows={3}
                    value={officialAddress}
                    onChange={(e) => {
                      const value = e.target.value;
                      setOfficialAddress(value);
                      if (touched.officialAddress) {
                        updateFieldError("officialAddress", value);
                      }
                    }}
                    onBlur={() => {
                      markFieldTouched("officialAddress");
                      updateFieldError("officialAddress", officialAddress);
                    }}
                    disabled={saving}
                    placeholder="Registered or official address"
                    aria-invalid={
                      !!(touched.officialAddress && fieldErrors.officialAddress)
                    }
                    className={`${styles.textarea} ${
                      touched.officialAddress && fieldErrors.officialAddress
                        ? styles.inputInvalid
                        : ""
                    }`}
                  />
                </div>
                <div className={styles.fieldHint}>
                  Registered legal or administrative address.
                </div>
                {touched.officialAddress && fieldErrors.officialAddress && (
                  <div className={styles.fieldError}>
                    {fieldErrors.officialAddress}
                  </div>
                )}
              </div>

              <div className={`form-group span-2 ${styles.fieldGroup}`}>
                <div className={styles.fieldLabelRow}>
                  <label className={styles.fieldLabel}>Delivery Address</label>
                  <span className={styles.fieldMeta}>Required</span>
                </div>
                <div className={styles.inputWrap}>
                  <textarea
                    rows={3}
                    value={deliveryAddress}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDeliveryAddress(value);
                      if (touched.deliveryAddress) {
                        updateFieldError("deliveryAddress", value);
                      }
                    }}
                    onBlur={() => {
                      markFieldTouched("deliveryAddress");
                      updateFieldError("deliveryAddress", deliveryAddress);
                    }}
                    disabled={saving}
                    placeholder="Preferred delivery destination"
                    aria-invalid={
                      !!(touched.deliveryAddress && fieldErrors.deliveryAddress)
                    }
                    className={`${styles.textarea} ${
                      touched.deliveryAddress && fieldErrors.deliveryAddress
                        ? styles.inputInvalid
                        : ""
                    }`}
                  />
                </div>
                <div className={styles.fieldHint}>
                  Where shipments should actually be delivered.
                </div>
                {touched.deliveryAddress && fieldErrors.deliveryAddress && (
                  <div className={styles.fieldError}>
                    {fieldErrors.deliveryAddress}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.actions}>
              <button type="submit" className="app-button" disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          </form>
        </section>

        <section className="panel">
          <div className="panel-header">
            <h2>Profile Status</h2>
          </div>

          <div className={styles.sidePanel}>
            <div
              className={`${styles.statusCard} ${
                complete ? styles.complete : styles.incomplete
              }`}
            >
              <div className={styles.statusTopRow}>
                <span className={styles.statusBadge}>
                  {complete ? "Complete" : "Incomplete"}
                </span>
                <span className={styles.statusCount}>
                  {completedCount}/{totalCount} fields
                </span>
              </div>

              <div className={styles.statusTitle}>
                {complete
                  ? "Your requester profile is ready."
                  : "A few required fields still need attention."}
              </div>

              <div className={styles.progressTrack} aria-hidden="true">
                <div
                  className={styles.progressFill}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>

            <div className={styles.checklistCard}>
              <div className={styles.checklistTitle}>Required fields</div>

              <div className={styles.checklist}>
                {requiredItems.map((item) => (
                  <div
                    key={item.label}
                    className={`${styles.checkItem} ${
                      item.done ? styles.done : styles.pending
                    }`}
                  >
                    <span className={styles.checkIcon} aria-hidden="true">
                      {item.done ? "✓" : "○"}
                    </span>
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.helpText}>
              Shipment submission is unavailable until all required profile
              fields are completed.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
