"use client";

import { addToast } from "@/components/ui/toaster";

export type ToastVariant = "default" | "destructive" | "success";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
}

export function useToast() {
  function toast(options: ToastOptions) {
    addToast({
      title: options.title,
      description: options.description,
      variant: options.variant || "default",
    });
  }

  return { toast };
}