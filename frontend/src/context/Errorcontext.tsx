import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, X, CheckCircle, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = "error" | "success" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ErrorContextType {
  showError: (message: string) => void;
  showSuccess: (message: string) => void;
  showInfo: (message: string) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// ─── Toast Component ──────────────────────────────────────────────────────────
const ToastItem: React.FC<{
  toast: Toast;
  onDismiss: (id: string) => void;
}> = ({ toast, onDismiss }) => {
  const icons = {
    error: <AlertCircle size={16} />,
    success: <CheckCircle size={16} />,
    info: <Info size={16} />,
  };

  return (
    <motion.div
      className={`toast toast-${toast.type}`}
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      layout
    >
      <span className="toast-icon">{icons[toast.type]}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>
        <X size={14} />
      </button>
    </motion.div>
  );
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export const ErrorProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4s
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ErrorContext.Provider
      value={{
        showError: (msg) => addToast("error", msg),
        showSuccess: (msg) => addToast("success", msg),
        showInfo: (msg) => addToast("info", msg),
      }}
    >
      {children}
      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ErrorContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) throw new Error("useError must be used within <ErrorProvider>");
  return context;
};
