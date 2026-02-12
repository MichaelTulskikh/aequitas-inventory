import { useEffect, useMemo, useState } from "react";
import "../styles/add-to-request-modal.css";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (qty: number) => Promise<void>;
  itemName: string;
  available: number;
};

export default function AddToRequestModal({
  open,
  onClose,
  onConfirm,
  itemName,
  available,
}: Props) {
  const [qty, setQty] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQty(1);
      setErr(null);
      setLoading(false);
    }
  }, [open]);

  const max = useMemo(() => Math.max(0, Number(available || 0)), [available]);

  if (!open) return null;

  return (
    <div className="atm-overlay" onClick={onClose}>
      <div className="atm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="atm-header">
          <h3>Add to request</h3>
          <button className="atm-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="atm-body">
          <div className="atm-item">{itemName}</div>
          <div className="atm-sub">Available: <strong>{max}</strong></div>

          <label className="atm-label">Quantity</label>
          <input
            className="atm-input"
            type="number"
            min={1}
            max={max}
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
          />

          {err && <div className="atm-error">{err}</div>}
        </div>

        <div className="atm-actions">
          <button className="atm-btn ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            className="atm-btn"
            disabled={loading || max <= 0 || qty < 1 || qty > max}
            onClick={async () => {
              try {
                setLoading(true);
                setErr(null);
                await onConfirm(qty);
                onClose();
              } catch (e: any) {
                setErr(e?.message || "Failed to add to request");
              } finally {
                setLoading(false);
              }
            }}
          >
            {loading ? "Adding…" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
