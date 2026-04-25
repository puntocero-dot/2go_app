"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

export function addToast(toast: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substring(2, 9);
  const newToast = { ...toast, id };
  toasts = [...toasts, newToast];
  listeners.forEach((listener) => listener(toasts));

  // Auto-dismiss después de 5 segundos
  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  listeners.forEach((listener) => listener(toasts));
}

function subscribe(listener: (toasts: Toast[]) => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return subscribe(setCurrentToasts);
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {currentToasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      removeToast(toast.id);
    }, 300);
  };

  const variantStyles = {
    default: "bg-white/[0.08] backdrop-blur-xl border-white/[0.12]",
    destructive: "bg-red-500/10 backdrop-blur-xl border-red-500/30",
    success: "bg-emerald-500/10 backdrop-blur-xl border-emerald-500/30",
  };

  const iconStyles = {
    default: "text-[#1da1f2]",
    destructive: "text-red-400",
    success: "text-emerald-400",
  };

  const Icon = {
    default: Info,
    destructive: AlertCircle,
    success: CheckCircle,
  }[toast.variant || "default"];

  return (
    <div
      className={cn(
        "relative flex gap-3 p-4 rounded-xl border shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-300",
        variantStyles[toast.variant || "default"],
        isExiting
          ? "opacity-0 translate-x-full"
          : "opacity-100 translate-x-0 animate-in slide-in-from-right"
      )}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[toast.variant || "default"])} />
      
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-white">{toast.title}</p>
        {toast.description && (
          <p className="text-sm text-white/60 mt-1">{toast.description}</p>
        )}
      </div>

      <button
        onClick={handleClose}
        className="flex-shrink-0 text-white/40 hover:text-white/70 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}