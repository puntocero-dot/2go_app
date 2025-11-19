'use client';

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OrdersBulkFormat } from "@/components/orders-bulk-format";

interface BulkSummary {
  processed: number;
  success: number;
  errors: number;
}

interface BulkResult {
  status: "success" | "error";
  row: number;
  codigoReferenciaRetail?: string;
  message?: string;
  autoAssigned?: boolean;
}

export function OrdersBulkUpload() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<BulkSummary | null>(null);
  const [results, setResults] = useState<BulkResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setFileName("");
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setErrorMessage("El archivo debe ser un CSV (.csv)");
      setFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setErrorMessage(null);
    setFileName(file.name);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setErrorMessage("Selecciona un archivo CSV primero");
      return;
    }

    try {
      setUploading(true);
      setErrorMessage(null);
      setSummary(null);
      setResults([]);

      const text = await file.text();
      const response = await fetch("/api/ordenes/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "text/csv;charset=utf-8",
        },
        body: text,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: "No se pudo procesar" }));
        throw new Error(data.error || "No se pudo procesar el archivo");
      }

      const data = await response.json();
      setSummary(data.summary ?? null);
      setResults(Array.isArray(data.results) ? data.results : []);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFileName("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error inesperado";
      setErrorMessage(message);
    } finally {
      setUploading(false);
    }
  };

  const hasResults = results.length > 0;

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Carga masiva de órdenes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Selecciona un archivo CSV con los encabezados requeridos. Las órdenes se crearán y se intentará
            asignar automáticamente a un armador disponible. Puedes descargar la estructura desde la sección de la derecha.
          </p>

          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-vibrant-cyan file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-vibrant-cyan/90"
              onChange={handleFileChange}
            />
            {fileName && <p className="text-xs text-gray-500">Archivo seleccionado: {fileName}</p>}
            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? "Procesando..." : "Subir y procesar"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.value = "";
                setFileName("");
                setErrorMessage(null);
                setSummary(null);
                setResults([]);
              }}
            >
              Limpiar
            </Button>
          </div>

          {summary && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              <p className="font-semibold">Resumen</p>
              <ul className="mt-2 space-y-1">
                <li>Filas procesadas: {summary.processed}</li>
                <li>Éxitos: {summary.success}</li>
                <li>Errores: {summary.errors}</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <OrdersBulkFormat />
      </div>

      {hasResults && (
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Detalle de resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="max-h-72 overflow-auto rounded-md border">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2">Fila</th>
                    <th className="px-3 py-2">Código</th>
                    <th className="px-3 py-2">Estado</th>
                    <th className="px-3 py-2">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((result) => (
                    <tr key={`${result.row}-${result.codigoReferenciaRetail ?? "error"}`} className={result.status === "error" ? "bg-red-50" : "bg-white"}>
                      <td className="px-3 py-2 font-mono text-xs">{result.row}</td>
                      <td className="px-3 py-2 text-xs">
                        {result.codigoReferenciaRetail ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        {result.status === "success" ? (
                          <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-800">
                            Éxito
                          </span>
                        ) : (
                          <span className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-800">
                            Error
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {result.status === "success"
                          ? result.autoAssigned
                            ? "Orden creada y auto-asignada"
                            : "Orden creada"
                          : result.message ?? "Error desconocido"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500">
              Si hubo errores, corrige las filas indicadas y vuelve a subir un archivo con las órdenes pendientes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
