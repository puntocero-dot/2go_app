"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);

      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowPrompt(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handler as any);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as any);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-negro-azabache text-white rounded-lg shadow-2xl p-4 border border-madera-natural/30 relative">
        <button
          onClick={() => setShowPrompt(false)}
          className="absolute top-2 right-2 text-white/60 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-lg bg-madera-natural flex items-center justify-center flex-shrink-0">
            <Download className="h-6 w-6 text-white" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold mb-1">Instalar App</h3>
            <p className="text-sm text-white/80 mb-3">
              Agrega 2Go a tu pantalla de inicio para acceso rapido
            </p>
            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full bg-madera-natural hover:bg-madera-natural/90"
            >
              Instalar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
