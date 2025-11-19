"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatearFecha } from "@/lib/utils";

export interface OrdenResumen {
  id: string;
  codigoReferenciaRetail: string;
  proyectoNombre: string;
  muebleNombre: string;
  clienteNombre: string;
  clienteMunicipio: string;
  armadorNombre: string | null;
  estado: string;
  fechaCreacion: string; // ISO
}

interface AdminOrdersTableProps {
  ordenes: OrdenResumen[];
}

export function AdminOrdersTable({ ordenes }: AdminOrdersTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allVisibleIds = ordenes.map((o) => o.id);

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === allVisibleIds.length ? [] : [...allVisibleIds]
    );
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    );
  };

  const handleBulkAutoAssign = async () => {
    const eligibleIds = ordenes
      .filter((o) => o.estado === "SIN_ASIGNAR" && selectedIds.includes(o.id))
      .map((o) => o.id);

    if (eligibleIds.length === 0) {
      setError("Selecciona al menos una orden SIN_ASIGNAR.");
      setFeedback(null);
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setFeedback(null);

      const response = await fetch("/api/ordenes/auto-asignar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ordenIds: eligibleIds }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo auto-asignar");
      }

      const summary = data?.summary ?? {};
      setFeedback(
        `Órdenes procesadas: ${summary.processed ?? eligibleIds.length}. Asignadas: ${summary.assigned ?? "0"}.`
      );

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al auto-asignar órdenes"
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkDeleteOrCancel = async () => {
    if (selectedIds.length === 0) {
      setError("Selecciona al menos una orden.");
      setFeedback(null);
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar/cancelar las órdenes seleccionadas?")) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      setFeedback(null);

      let deleted = 0;
      let cancelled = 0;
      let errors = 0;

      for (const id of selectedIds) {
        try {
          const response = await fetch(`/api/ordenes/${id}`, {
            method: "DELETE",
          });
          const data = await response.json().catch(() => null);

          if (!response.ok) {
            errors += 1;
            continue;
          }

          if (data?.action === "deleted") {
            deleted += 1;
          } else if (data?.action === "cancelled") {
            cancelled += 1;
          }
        } catch (err) {
          console.error(err);
          errors += 1;
        }
      }

      setFeedback(
        `Eliminadas: ${deleted}. Canceladas: ${cancelled}. Errores: ${errors}.`
      );
      setSelectedIds([]);

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Error al eliminar/cancelar órdenes"
      );
    } finally {
      setProcessing(false);
    }
  };

  const isBusy = processing || isPending;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <CardTitle>Todas las Órdenes</CardTitle>
          <div className="flex flex-wrap gap-3 text-sm">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={ordenes.length === 0 || isBusy}
            >
              {selectedIds.length === allVisibleIds.length
                ? "Deseleccionar todas"
                : "Seleccionar todas"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleBulkAutoAssign}
              disabled={selectedIds.length === 0 || isBusy}
              className="bg-vibrant-cyan hover:bg-vibrant-cyan/90"
            >
              Auto-asignar seleccionadas
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={handleBulkDeleteOrCancel}
              disabled={selectedIds.length === 0 || isBusy}
            >
              Eliminar / cancelar seleccionadas
            </Button>
          </div>
        </div>
        {feedback ? (
          <p className="mt-2 text-xs text-emerald-700">{feedback}</p>
        ) : null}
        {error ? (
          <p className="mt-2 text-xs text-red-600">{error}</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40px] text-center">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas las órdenes visibles"
                  checked={
                    ordenes.length > 0 &&
                    selectedIds.length === allVisibleIds.length
                  }
                  onChange={toggleSelectAll}
                  disabled={ordenes.length === 0}
                />
              </TableHead>
              <TableHead>Código</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Mueble</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Armador</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center text-muted-foreground"
                >
                  No hay órdenes registradas
                </TableCell>
              </TableRow>
            ) : (
              ordenes.map((orden) => {
                const isSelected = selectedIds.includes(orden.id);
                const isSinAsignar = orden.estado === "SIN_ASIGNAR";

                return (
                  <TableRow
                    key={orden.id}
                    className={isSelected ? "bg-muted/60" : undefined}
                  >
                    <TableCell className="text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(orden.id)}
                        aria-label={`Seleccionar orden ${orden.codigoReferenciaRetail}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {orden.codigoReferenciaRetail}
                    </TableCell>
                    <TableCell>{orden.proyectoNombre}</TableCell>
                    <TableCell>{orden.muebleNombre}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{orden.clienteNombre}</div>
                        <div className="text-sm text-muted-foreground">
                          {orden.clienteMunicipio}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {orden.armadorNombre ? (
                        <span className="text-sm">{orden.armadorNombre}</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin asignar</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isSinAsignar ? (
                        <Link
                          href={`/admin/ordenes/${orden.id}`}
                          className="inline-block"
                        >
                          <Badge
                            variant="destructive"
                            className="cursor-pointer transition-colors hover:opacity-90"
                          >
                            {orden.estado.replace(/_/g, " ")}
                          </Badge>
                        </Link>
                      ) : (
                        <Badge
                          variant={
                            orden.estado === "ARMADO_COMPLETADO"
                              ? "success"
                              : "warning"
                          }
                        >
                          {orden.estado.replace(/_/g, " ")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatearFecha(new Date(orden.fechaCreacion))}
                    </TableCell>
                    <TableCell>
                      <Link href={`/admin/ordenes/${orden.id}`}>
                        <Button variant="outline" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
