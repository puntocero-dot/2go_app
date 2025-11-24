"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { TableSkeleton } from "@/components/ui/loading-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatearFecha } from "@/lib/utils";
import { 
  FileText, 
  Package, 
  Users, 
  MapPin, 
  Calendar, 
  CheckSquare,
  Square,
  Eye,
  Edit,
  Truck,
  AlertCircle,
  Clock,
  CheckCircle
} from "lucide-react";

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
  loading?: boolean;
}

const ESTADOS_CONFIG = {
  "SIN_ASIGNAR": { 
    label: "Sin asignar", 
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Clock,
    description: "Esperando asignación"
  },
  "ASIGNADO": { 
    label: "Asignado", 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Users,
    description: "Armador asignado"
  },
  "EN_RUTA": { 
    label: "En ruta", 
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Truck,
    description: "En transporte"
  },
  "ARMADO_INICIADO": { 
    label: "Armado iniciado", 
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: AlertCircle,
    description: "En proceso de armado"
  },
  "ARMADO_FINALIZADO": { 
    label: "Armado finalizado", 
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: CheckCircle,
    description: "Armado completado"
  },
  "ARMADO_COMPLETADO": { 
    label: "Armado completado", 
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    description: "Entrega finalizada"
  },
};

function EstadoBadge({ estado }: { estado: string }) {
  const config = ESTADOS_CONFIG[estado as keyof typeof ESTADOS_CONFIG] || ESTADOS_CONFIG["SIN_ASIGNAR"];
  const Icon = config.icon;
  
  return (
    <Badge className={`${config.color} border flex items-center gap-1 px-3 py-1`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
}

function TableRowEnhanced({ 
  orden, 
  index, 
  isSelected, 
  onSelect,
  onView
}: { 
  orden: OrdenResumen; 
  index: number; 
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
}) {
  return (
    <TableRow 
      className={`hover:bg-muted/50 transition-all duration-200 cursor-pointer group ${
        isSelected ? "bg-muted/30 border-l-4 border-primary" : ""
      }`}
    >
      <TableCell className="font-medium">
        <div className="flex items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
            className="mr-3 text-muted-foreground hover:text-primary transition-colors"
          >
            {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
          </button>
          <div className="flex items-center">
            <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-muted-foreground mr-2">#{index + 1}</span>
            <span className="font-medium">{orden.codigoReferenciaRetail}</span>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center">
          <Package className="w-4 h-4 mr-2 text-muted-foreground" />
          <div>
            <div className="font-medium">{orden.proyectoNombre}</div>
            <div className="text-sm text-muted-foreground">{orden.muebleNombre}</div>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-2 text-muted-foreground" />
          <div>
            <div className="font-medium">{orden.clienteNombre}</div>
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin className="w-3 h-3 mr-1" />
              {orden.clienteMunicipio}
            </div>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        {orden.armadorNombre ? (
          <div className="flex items-center">
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center mr-2">
              <Users className="w-3 h-3 text-primary" />
            </div>
            <span className="font-medium">{orden.armadorNombre}</span>
          </div>
        ) : (
          <span className="text-muted-foreground italic">No asignado</span>
        )}
      </TableCell>
      
      <TableCell>
        <EstadoBadge estado={orden.estado} />
      </TableCell>
      
      <TableCell>
        <div className="flex items-center text-muted-foreground">
          <Calendar className="w-4 h-4 mr-2" />
          <div>
            <div className="text-sm">{formatearFecha(orden.fechaCreacion)}</div>
            <div className="text-xs text-muted-foreground">
              {new Date(orden.fechaCreacion).toLocaleTimeString("es-ES", {
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
        </div>
      </TableCell>
      
      <TableCell>
        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <EnhancedButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="h-8 w-8 p-0"
          >
            <Eye className="w-4 h-4" />
          </EnhancedButton>
          <Link href={`/admin/ordenes/${orden.id}/editar`}>
            <EnhancedButton
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <Edit className="w-4 h-4" />
            </EnhancedButton>
          </Link>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function AdminOrdersTable({ ordenes, loading = false }: AdminOrdersTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(false);

  const allVisibleIds = ordenes.map((o) => o.id);

  const toggleSelectAll = () => {
    setSelectedIds((current) =>
      current.length === allVisibleIds.length ? [] : [...allVisibleIds]
    );
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((selectedId) => selectedId !== id)
        : [...current, id]
    );
  };

  const handleViewOrder = (id: string) => {
    startTransition(() => {
      router.push(`/admin/ordenes/${id}`);
    });
  };

  const handleBulkAutoAssign = async () => {
    if (selectedIds.length === 0) return;
    
    setProcessing(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map(async (ordenId) => {
          const response = await fetch(`/api/ordenes/${ordenId}/asignacion-automatica`, {
            method: 'POST',
          });
          if (!response.ok) {
            throw new Error(`Error en orden ${ordenId}`);
          }
          return response.json();
        })
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (successful > 0) {
        alert(`✅ ${successful} orden(es) asignada(s) automáticamente${failed > 0 ? `. ${failed} fallaron.` : ''}`);
        setSelectedIds([]);
        router.refresh();
      } else {
        alert('❌ No se pudo asignar ninguna orden automáticamente');
      }
    } catch (error) {
      console.error('Error en asignación automática:', error);
      alert('❌ Error al procesar asignación automática');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <EnhancedCard>
        <TableSkeleton rows={8} columns={7} />
      </EnhancedCard>
    );
  }

  if (ordenes.length === 0) {
    return (
      <EnhancedCard className="text-center py-12">
        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No hay órdenes para mostrar
        </h3>
        <p className="text-muted-foreground">
          No se encontraron órdenes con los filtros seleccionados.
        </p>
      </EnhancedCard>
    );
  }

  return (
    <EnhancedCard>
      {/* Header con acciones bulk */}
      {selectedIds.length > 0 && (
        <div className="border-b bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CheckSquare className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm font-medium">
                {selectedIds.length} {selectedIds.length === 1 ? "orden seleccionada" : "órdenes seleccionadas"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <EnhancedButton
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Limpiar selección
              </EnhancedButton>
              <EnhancedButton
                variant="default"
                size="sm"
                disabled={processing || selectedIds.length === 0}
                onClick={handleBulkAutoAssign}
              >
                {processing ? "Procesando..." : "Asignación Automática"}
              </EnhancedButton>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 sticky top-0">
              <TableHead className="font-semibold w-[300px]">
                <div className="flex items-center">
                  <button
                    onClick={toggleSelectAll}
                    className="mr-3 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {selectedIds.length === allVisibleIds.length ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                  Orden
                </div>
              </TableHead>
              <TableHead className="font-semibold">Proyecto</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Armador</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold">Fecha</TableHead>
              <TableHead className="font-semibold text-right w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ordenes.map((orden, index) => (
              <TableRowEnhanced
                key={orden.id}
                orden={orden}
                index={index}
                isSelected={selectedIds.includes(orden.id)}
                onSelect={() => toggleSelectOne(orden.id)}
                onView={() => handleViewOrder(orden.id)}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer con paginación o info */}
      <div className="border-t bg-muted/20 p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Mostrando {ordenes.length} {ordenes.length === 1 ? "orden" : "órdenes"}
          </div>
          <div className="flex items-center space-x-4">
            <span>Resultados por página: 100</span>
            <div className="flex items-center space-x-2">
              <EnhancedButton variant="outline" size="sm" disabled>
                Anterior
              </EnhancedButton>
              <span className="px-3 py-1 bg-primary text-primary-foreground rounded-md text-xs">
                1
              </span>
              <EnhancedButton variant="outline" size="sm" disabled>
                Siguiente
              </EnhancedButton>
            </div>
          </div>
        </div>
      </div>
    </EnhancedCard>
  );
}
