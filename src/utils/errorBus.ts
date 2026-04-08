type ToastType = "error" | "success" | "warning" | "info";

type ToastHandler = (msg: string, type: ToastType) => void;

let handler: ToastHandler | null = null;

export function registerToastHandler(fn: ToastHandler) {
  handler = fn;
}

export function emitToast(msg: string, type: ToastType = "error") {
  if (handler) handler(msg, type);
}

export function emitError(msg: string) {
  emitToast(msg, "error");
}