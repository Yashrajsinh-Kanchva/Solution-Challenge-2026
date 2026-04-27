"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

let toastListeners: ((toast: Toast) => void)[] = [];

export function showToast(message: string, type: ToastType = "info", duration = 3500) {
  const toast: Toast = { id: `${Date.now()}`, type, message, duration };
  toastListeners.forEach(fn => fn(toast));
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-green-500 shrink-0" />,
  error:   <XCircle size={18} className="text-red-500 shrink-0" />,
  warning: <AlertTriangle size={18} className="text-yellow-500 shrink-0" />,
  info:    <Info size={18} className="text-blue-500 shrink-0" />,
};

const bgColors: Record<ToastType, string> = {
  success: "border-green-200 bg-green-50",
  error:   "border-red-200 bg-red-50",
  warning: "border-yellow-200 bg-yellow-50",
  info:    "border-blue-200 bg-blue-50",
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (toast: Toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, toast.duration || 3500);
    };
    toastListeners.push(handler);
    return () => { toastListeners = toastListeners.filter(fn => fn !== handler); };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-5 py-4 rounded-2xl border-2 shadow-xl max-w-sm w-full pointer-events-auto animate-in slide-in-from-right duration-300 ${bgColors[toast.type]}`}
        >
          {icons[toast.type]}
          <p className="text-sm font-bold text-on-surface flex-1">{toast.message}</p>
          <button
            onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
            className="p-1 rounded-lg hover:bg-black/5 transition-all"
          >
            <X size={14} className="text-secondary/50" />
          </button>
        </div>
      ))}
    </div>
  );
}
