import { type ReactNode, useEffect } from "react";
import "../styles_new/app-modal.css"

type Props = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  width?: string;
};

export default function AppModal({
  title,
  children,
  onClose,
  width = "900px",
}: Props) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div
        className="app-modal-content"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal-header">
          <div className="app-modal-title">{title || "Details"}</div>

          <button
            type="button"
            className="app-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="app-modal-body">{children}</div>
      </div>
    </div>
  );
}