import { createContext, useContext, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const toastMethods = useMemo(
    () => ({
      success: (message, duration = 4000) =>
        toast.success(message, { duration }),
      error: (message, duration = 4000) => toast.error(message, { duration }),
      warning: (message, duration = 4000) =>
        toast(message, {
          duration,
          icon: "⚠️",
          style: {
            background: "#fef3c7",
            color: "#92400e",
            border: "1px solid #fcd34d",
          },
        }),
      info: (message, duration = 4000) =>
        toast(message, {
          duration,
          icon: "ℹ️",
          style: {
            background: "#dbeafe",
            color: "#1e40af",
            border: "1px solid #93c5fd",
          },
        }),
      dismiss: toast.dismiss,
      loading: (message) => toast.loading(message),
      promise: (promise, msgs) => toast.promise(promise, msgs),
    }),
    [],
  );

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#18181b",
            color: "#fff",
            borderRadius: "10px",
            padding: "12px 16px",
            fontSize: "14px",
          },
          success: {
            style: {
              background: "#ecfdf5",
              color: "#065f46",
              border: "1px solid #6ee7b7",
            },
            iconTheme: {
              primary: "#10b981",
              secondary: "#fff",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fca5a5",
            },
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
