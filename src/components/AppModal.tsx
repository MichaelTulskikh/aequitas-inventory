import { type ReactNode, useEffect } from "react";
import styles from "./AppModal.module.css"

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
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.content}
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <div className={styles.title}>{title || "Details"}</div>

          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}