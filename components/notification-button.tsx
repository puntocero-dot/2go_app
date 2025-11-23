"use client";

import { useState, useTransition } from "react";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Mail,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface NotificationButtonProps {
  ordenId: string;
  ordenCodigo: string;
  estadoActual: string;
  clienteEmail?: string;
  disabled?: boolean;
}

export function NotificationButton({
  ordenId,
  ordenCodigo,
  estadoActual,
  clienteEmail,
  disabled = false,
}: NotificationButtonProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const busy = disabled || loading || isPending;
  const hasEmail = !!clienteEmail;

  const handleSendNotification = () => {
    if (busy || !hasEmail) return;

    startTransition(async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/notifications/order-status/${ordenId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            tipoNotificacion: "ESTADO_ACTUALIZADO",
            mensajeAdicional: `Actualización del estado: ${estadoActual}`
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "No se pudo enviar la notificación");
        }

        toast({
          title: "✅ Notificación enviada",
          description: `Se ha enviado la actualización del estado a ${clienteEmail}`,
          variant: "success",
        });
      } catch (error) {
        console.error("Error al enviar notificación:", error);
        toast({
          title: "❌ Error al enviar",
          description: error instanceof Error ? error.message : "No se pudo enviar la notificación",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    });
  };

  const getNotificationIcon = () => {
    if (loading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (!hasEmail) return <AlertCircle className="w-4 h-4" />;
    return <Mail className="w-4 h-4" />;
  };

  const getButtonText = () => {
    if (loading) return "Enviando...";
    if (!hasEmail) return "Sin email de cliente";
    return "Enviar Notificación";
  };

  return (
    <EnhancedButton
      onClick={handleSendNotification}
      disabled={busy || !hasEmail}
      variant={hasEmail ? "default" : "outline"}
      size="sm"
      className={hasEmail ? "min-w-[180px]" : "min-w-[200px]"}
    >
      {getNotificationIcon()}
      <span className="ml-2">{getButtonText()}</span>
    </EnhancedButton>
  );
}

// Componente para notificaciones de sistema
export function SystemNotificationButton({
  title,
  message,
  actionUrl,
  actionText,
  disabled = false,
}: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  disabled?: boolean;
}) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const busy = disabled || loading || isPending;

  const handleSendSystemNotification = () => {
    if (busy) return;

    startTransition(async () => {
      try {
        setLoading(true);

        const response = await fetch(`/api/notifications/system`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title,
            message,
            actionUrl,
            actionText
          }),
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(data?.error || "No se pudo enviar la notificación del sistema");
        }

        toast({
          title: "✅ Notificación del sistema enviada",
          description: "La notificación ha sido enviada a todos los usuarios",
          variant: "success",
        });
      } catch (error) {
        console.error("Error al enviar notificación del sistema:", error);
        toast({
          title: "❌ Error al enviar",
          description: error instanceof Error ? error.message : "No se pudo enviar la notificación",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <EnhancedButton
      onClick={handleSendSystemNotification}
      disabled={busy}
      variant="outline"
      size="sm"
      className="min-w-[200px]"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin mr-2" />
      ) : (
        <Bell className="w-4 h-4 mr-2" />
      )}
      Enviar Notificación
    </EnhancedButton>
  );
}
