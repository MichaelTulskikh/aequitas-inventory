import { createContext, useContext, useState, type ReactNode } from "react";
import { registerToastHandler } from "../utils/errorBus";

type ToastType = "error" | "success" | "warning" | "info";

type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastContextType = {
  showError: (msg: string) => void;
  showSuccess: (msg: string) => void;
  showWarning: (msg: string) => void;
  showInfo: (msg: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now();

    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  registerToastHandler(addToast);

  const remove = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider
      value={{
        showError: (m) => addToast(m, "error"),
        showSuccess: (m) => addToast(m, "success"),
        showWarning: (m) => addToast(m, "warning"),
        showInfo: (m) => addToast(m, "info"),
      }}
    >
      {children}

      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
            <button onClick={() => remove(t.id)}>×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside ToastProvider");
  return ctx;
}