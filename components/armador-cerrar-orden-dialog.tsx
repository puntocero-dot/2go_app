"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, CheckCircle2, AlertCircle, Video, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ArmadorCerrarOrdenDialogProps {
  ordenId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onCompleted?: () => void;
}

interface GpsData {
  latitud: number;
  longitud: number;
}

type EvidenciaTipo = "FOTO" | "VIDEO";

export function ArmadorCerrarOrdenDialog({
  ordenId,
  open: controlledOpen,
  onOpenChange,
  onCompleted,
}: ArmadorCerrarOrdenDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [nombreReceptor, setNombreReceptor] = useState("");
  const [documentoReceptor, setDocumentoReceptor] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [csatScore, setCsatScore] = useState<number | null>(null);
  const [csatComment, setCsatComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    { tipo: "success" | "error"; mensaje: string } | null
  >(null);
  const [currentUpload, setCurrentUpload] = useState(0);
  const { toast } = useToast();

  const obtenerGps = useCallback(async (): Promise<GpsData | undefined> => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return undefined;
    }

    return new Promise<GpsData | undefined>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitud: pos.coords.latitude,
            longitud: pos.coords.longitude,
          });
        },
        () => resolve(undefined),
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setFeedback(null);
      setCurrentUpload(0);

      const nombre = nombreReceptor.trim();
      const documento = documentoReceptor.trim();

      const errores: string[] = [];
      let primerCampo: "nombre" | "files" | null = null;

      if (!nombre) {
        errores.push("El nombre del receptor es obligatorio");
        if (!primerCampo) primerCampo = "nombre";
      } else if (nombre.length < 3) {
        errores.push("El nombre del receptor debe tener al menos 3 caracteres");
        if (!primerCampo) primerCampo = "nombre";
      }

      if (files.length === 0) {
        errores.push("Debes adjuntar al menos una foto como evidencia");
        if (!primerCampo) primerCampo = "files";
      }

      if (files.length > 10) {
        errores.push("Máximo 10 archivos por orden");
      }

      if (errores.length > 0) {
        const mensaje = errores.join(". ");
        setFeedback({ tipo: "error", mensaje });
        setError(mensaje);

        if (typeof window !== "undefined" && primerCampo) {
          const targetId = primerCampo === "nombre" ? "nombreReceptor" : "evidencias";
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
            if (typeof (el as HTMLElement).focus === "function") {
              (el as HTMLElement).focus();
            }
          }
        }

        setLoading(false);
        return;
      }

      const gps = await obtenerGps();

      const evidencias: { url: string; tipo: EvidenciaTipo }[] = [];

      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        setCurrentUpload(index + 1);
        const tipo: EvidenciaTipo = file.type.startsWith("video/") ? "VIDEO" : "FOTO";

        const signRes = await fetch(`/api/ordenes/${ordenId}/archivos/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo,
            size: file.size,
            contentType: file.type,
          }),
        });

        const signData = await signRes.json().catch(() => null);

        if (!signRes.ok) {
          throw new Error(signData?.error || "No se pudo generar la firma de subida.");
        }

        const uploadUrl: string | undefined = signData?.uploadUrl;
        const params: Record<string, string | number> | undefined = signData?.params;

        if (!uploadUrl || !params) {
          throw new Error("Respuesta inválida al generar la firma de Cloudinary.");
        }

        const formData = new FormData();
        formData.append("file", file);
        Object.entries(params).forEach(([key, value]) => {
          formData.append(key, String(value));
        });

        const uploadRes = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json().catch(() => null);

        if (!uploadRes.ok) {
          throw new Error(
            uploadData?.error?.message ||
              uploadData?.error ||
              "Error al subir el archivo a Cloudinary."
          );
        }

        const url: string | undefined = uploadData?.secure_url || uploadData?.url;

        if (!url) {
          throw new Error("Cloudinary no devolvió una URL válida para el archivo.");
        }

        evidencias.push({ url, tipo });
      }

      const registrarRes = await fetch(`/api/ordenes/${ordenId}/archivos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archivos: evidencias }),
      });

      const registrarData = await registrarRes.json().catch(() => null);

      if (!registrarRes.ok) {
        throw new Error(
          registrarData?.error || "No se pudieron registrar las evidencias de la orden."
        );
      }

      const body: any = {
        estado: "ARMADO_COMPLETADO",
        receptor: {
          nombre,
          documento: documento || undefined,
        },
      };

      const trimmedCsatComment = csatComment.trim();
      if (
        (typeof csatScore === "number" && csatScore >= 1 && csatScore <= 5) ||
        trimmedCsatComment.length > 0
      ) {
        body.csat = {
          puntaje:
            typeof csatScore === "number" && csatScore >= 1 && csatScore <= 5
              ? csatScore
              : undefined,
          comentario: trimmedCsatComment.length > 0 ? trimmedCsatComment : undefined,
        };
      }

      if (gps && typeof gps.latitud === "number" && typeof gps.longitud === "number") {
        body.gps = gps;
      }

      const putRes = await fetch(`/api/ordenes/${ordenId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const putData = await putRes.json().catch(() => null);

      if (!putRes.ok) {
        throw new Error(
          putData?.error || "No se pudo marcar la orden como completada."
        );
      }

      setFeedback({
        tipo: "success",
        mensaje: "Orden completada exitosamente. Redirigiendo...",
      });

      setFiles([]);
      setFilePreviews([]);

      toast({
        title: "¡Orden completada!",
        description: "Las evidencias han sido subidas correctamente.",
      });

      setTimeout(() => {
        setOpen(false);
        if (onCompleted) {
          onCompleted();
        } else {
          router.refresh();
        }
      }, 1500);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error
          ? err.message
          : "Error al completar la orden. Intenta de nuevo.";
      setError(message);
      setFeedback({
        tipo: "error",
        mensaje: message,
      });
      toast({
        title: "Error al completar la orden",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [
    csatComment,
    csatScore,
    documentoReceptor,
    files,
    nombreReceptor,
    obtenerGps,
    onCompleted,
    ordenId,
    router,
  ]);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  const busy = loading;

  // Calcular si se puede enviar
  const canSubmit =
    nombreReceptor.trim().length >= 3 &&
    files.length > 0 &&
    !loading;

  // Prevenir cierre durante carga (ESC, overlay, etc.)
  const handleOpenChange = (newOpen: boolean) => {
    if (loading && !newOpen) {
      return;
    }
    setOpen(newOpen);
  };

  const handleFilesChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files;
      if (!selectedFiles) return;

      const filesArray = Array.from(selectedFiles);
      setFiles(filesArray);

      const previews: string[] = new Array(filesArray.length).fill("");
      let processed = 0;

      filesArray.forEach((file, index) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            previews[index] = reader.result as string;
            processed += 1;
            if (processed === filesArray.length) {
              setFilePreviews(previews);
            }
          };
          reader.readAsDataURL(file);
        } else {
          // Videos no tienen preview de imagen por ahora
          previews[index] = "";
          processed += 1;
          if (processed === filesArray.length) {
            setFilePreviews(previews);
          }
        }
      });
    },
    [],
  );

  const handleClose = () => {
    setFiles([]);
    setFilePreviews([]);
    setNombreReceptor("");
    setDocumentoReceptor("");
    setCsatScore(null);
    setCsatComment("");
    setError(null);
    setFeedback(null);
    handleOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      {controlledOpen === undefined && (
        <Dialog.Trigger asChild>
          <Button
            type="button"
            size="sm"
            className="bg-vibrant-cyan hover:bg-vibrant-cyan/90"
            disabled={busy}
          >
            {busy ? "Guardando..." : "Marcar como completado"}
          </Button>
        </Dialog.Trigger>
      )}

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold mb-2">
            Cerrar orden
          </Dialog.Title>
          <Dialog.Description className="text-sm text-gray-600 mb-4">
            Registra las evidencias, el receptor y la ubicación actual para completar el
            servicio.
          </Dialog.Description>
          {feedback?.tipo === "success" && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm">
              <div className="flex gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">¡Éxito!</p>
                  <p className="text-green-800">{feedback.mensaje}</p>
                </div>
              </div>
            </div>
          )}
          {feedback?.tipo === "error" && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-900">Error</p>
                  <p className="text-red-800">{feedback.mensaje}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="nombreReceptor">Nombre de quien recibe</Label>
              <Input
                id="nombreReceptor"
                value={nombreReceptor}
                onChange={(e) => setNombreReceptor(e.target.value)}
                placeholder="Nombre completo"
                disabled={busy}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="documentoReceptor">Documento (opcional)</Label>
              <Input
                id="documentoReceptor"
                value={documentoReceptor}
                onChange={(e) => setDocumentoReceptor(e.target.value)}
                placeholder="DUI u otro documento"
                disabled={busy}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="evidencias">Evidencias (fotos/videos)</Label>
              <Input
                id="evidencias"
                type="file"
                multiple
                accept="image/*,video/*"
                disabled={busy}
                onChange={handleFilesChange}
              />
              <p className="text-[11px] text-gray-500">
                Adjunta al menos una foto o video. Tamaño máximo recomendado: 25MB por
                archivo.
              </p>
              {files.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-2">
                    {files.length} archivo{files.length > 1 ? "s" : ""} seleccionado
                    {files.length > 1 ? "s" : ""}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {files.map((file, index) => (
                      <div key={index} className="relative aspect-square group">
                        {file.type.startsWith("image/") && filePreviews[index] ? (
                          <img
                            src={filePreviews[index]}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-md border"
                          />
                        ) : (
                          <div className="w-full h-full rounded-md border bg-gray-100 flex items-center justify-center">
                            <Video className="h-8 w-8 text-gray-400" />
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = files.filter((_, i) => i !== index);
                            const newPreviews = filePreviews.filter((_, i) => i !== index);
                            setFiles(newFiles);
                            setFilePreviews(newPreviews);
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>

                        <p className="text-[10px] text-gray-600 mt-1 truncate">
                          {file.name}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {loading && files.length > 0 && (
                <div className="mt-2 flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 p-2 text-xs text-blue-900">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>
                    Subiendo {currentUpload} de {files.length} archivos...
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="csatScore">Satisfacción del cliente (1 a 5, opcional)</Label>
              <Input
                id="csatScore"
                type="number"
                min={1}
                max={5}
                disabled={busy}
                value={csatScore ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  if (!value) {
                    setCsatScore(null);
                    return;
                  }
                  const parsed = Number.parseInt(value, 10);
                  if (Number.isNaN(parsed)) {
                    setCsatScore(null);
                    return;
                  }
                  setCsatScore(parsed);
                }}
                placeholder="De 1 (muy insatisfecho) a 5 (muy satisfecho)"
              />
              <p className="text-[11px] text-gray-500">
                Este dato nos ayuda a medir la satisfacción del cliente con el servicio.
              </p>
            </div>

            <div className="space-y-1">
              <Label htmlFor="csatComment">Comentario del cliente (opcional)</Label>
              <Input
                id="csatComment"
                value={csatComment}
                onChange={(e) => setCsatComment(e.target.value)}
                placeholder="¿Algo que debamos saber sobre la experiencia del cliente?"
                disabled={busy}
              />
            </div>

            {error ? (
              <p className="text-xs text-red-600 whitespace-pre-line">{error}</p>
            ) : null}
          </div>

          <div className="mt-6 flex justify-end gap-2 text-sm">
            <Dialog.Close asChild>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!canSubmit}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentUpload > 0 && files.length > 0
                    ? `Subiendo ${currentUpload} de ${files.length}...`
                    : "Procesando..."}
                </>
              ) : (
                "Completar orden"
              )}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

