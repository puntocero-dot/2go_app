"use client";

import { useState, useMemo, useTransition, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { isToday, isYesterday, format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
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
import { addToast } from "@/components/ui/toaster";
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
  CheckCircle,
  Search,
  ArrowUpDown
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
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
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

const TableRowEnhanced = memo(function TableRowEnhanced({ 
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
});

export function AdminOrdersTable({ ordenes, loading = false, currentPage, totalPages, totalCount }: AdminOrdersTableProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [_isPending, startTransition] = useTransition();
  const [processing, setProcessing] = useState(false);
  const [sortKey, setSortKey] = useState<"fecha" | "estado" | "proyecto">("fecha");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [searchLocal, setSearchLocal] = useState("");

  // Sort and filter client-side
  const filteredAndSorted = useMemo(() => {
    let result = [...ordenes];

    if (searchLocal.trim()) {
      const q = searchLocal.toLowerCase();
      result = result.filter(
        (o) =>
          o.codigoReferenciaRetail.toLowerCase().includes(q) ||
          o.clienteNombre.toLowerCase().includes(q) ||
          o.proyectoNombre.toLowerCase().includes(q) ||
          (o.armadorNombre && o.armadorNombre.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "fecha") {
        cmp = new Date(a.fechaCreacion).getTime() - new Date(b.fechaCreacion).getTime();
      } else if (sortKey === "estado") {
        const order = ["SIN_ASIGNAR", "ASIGNADO", "EN_RUTA", "ARMADO_INICIADO", "ARMADO_FINALIZADO", "ARMADO_COMPLETADO"];
        cmp = order.indexOf(a.estado) - order.indexOf(b.estado);
      } else if (sortKey === "proyecto") {
        cmp = a.proyectoNombre.localeCompare(b.proyectoNombre);
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [ordenes, sortKey, sortDir, searchLocal]);

  // Group by date
  const grouped = useMemo(() => {
    const groups: { label: string; key: string; items: OrdenResumen[] }[] = [];
    const map = new Map<string, OrdenResumen[]>();

    for (const orden of filteredAndSorted) {
      const date = parseISO(orden.fechaCreacion);
      const key = format(date, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(orden);
    }

    for (const [key, items] of map) {
      const date = parseISO(key);
      let label: string;
      if (isToday(date)) {
        label = "Hoy";
      } else if (isYesterday(date)) {
        label = "Ayer";
      } else {
        label = format(date, "d 'de' MMMM, yyyy", { locale: es });
      }
      groups.push({ label, key, items });
    }

    return groups;
  }, [filteredAndSorted]);

  const allVisibleIds = filteredAndSorted.map((o) => o.id);

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
      // Paso 1: Obtener sugerencias y asignar en un solo paso
      const results = await Promise.allSettled(
        selectedIds.map(async (ordenId) => {
          // Obtener sugerencia
          const suggestionResponse = await fetch(`/api/ordenes/${ordenId}/asignacion-automatica`, {
            method: 'POST',
          });
          
          if (!suggestionResponse.ok) {
            throw new Error(`Error obteniendo sugerencia para orden ${ordenId}`);
          }
          
          const suggestionData = await suggestionResponse.json();
          
          if (!suggestionData.sugerencia) {
            throw new Error(`No hay sugerencia disponible para orden ${ordenId}`);
          }
          
          // Paso 2: Asignar el armador sugerido
          const assignResponse = await fetch(`/api/ordenes/${ordenId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              armadorId: suggestionData.sugerencia.armadorId,
              estado: 'ASIGNADO',
              autoAssignMeta: {
                heuristica: suggestionData.heuristica || null,
                score: suggestionData.sugerencia.score,
                etaEstimadoMin: suggestionData.sugerencia.etaEstimadoMin,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                alternativas: (suggestionData.alternativas || []).map((alt: any) => ({
                  armadorId: alt.armadorId,
                  score: alt.score,
                  etaEstimadoMin: alt.etaEstimadoMin,
                })),
                generadoEn: new Date().toISOString(),
              },
            }),
          });
          
          if (!assignResponse.ok) {
            throw new Error(`Error asignando armador para orden ${ordenId}`);
          }
          
          return { ordenId, success: true };
        })
      );

      const successful = results.filter((r) => r.status === 'fulfilled').length;
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (successful > 0) {
        addToast({ title: `${successful} orden(es) asignada(s) automaticamente`, description: failed > 0 ? `${failed} fallaron.` : undefined, variant: "success" });
        setSelectedIds([]);
        startTransition(() => {
          router.refresh();
        });
      } else {
        addToast({ title: "No se pudo asignar ninguna orden automaticamente", variant: "destructive" });
      }
    } catch (error) {
      console.error('Error en asignación automática:', error);
      addToast({ title: "Error al procesar asignacion automatica", variant: "destructive" });
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

      {/* Sort & Search Toolbar */}
      <div className="border-b p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ordenar:</span>
          {(["fecha", "estado", "proyecto"] as const).map((key) => (
            <button
              key={key}
              onClick={() => {
                if (sortKey === key) {
                  setSortDir((d) => (d === "desc" ? "asc" : "desc"));
                } else {
                  setSortKey(key);
                  setSortDir("desc");
                }
              }}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                sortKey === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {key === "fecha" ? "Fecha" : key === "estado" ? "Estado" : "Proyecto"}
              {sortKey === key && <ArrowUpDown className="w-3 h-3" />}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchLocal}
            onChange={(e) => setSearchLocal(e.target.value)}
            placeholder="Buscar orden, cliente..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-input bg-background text-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all"
          />
        </div>
      </div>

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
                    {selectedIds.length === allVisibleIds.length && allVisibleIds.length > 0 ? (
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
            {grouped.map((group) => (
              <>
                <TableRow key={`header-${group.key}`} className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={7} className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                        {group.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({group.items.length})
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
                {group.items.map((orden, index) => (
                  <TableRowEnhanced
                    key={orden.id}
                    orden={orden}
                    index={index}
                    isSelected={selectedIds.includes(orden.id)}
                    onSelect={() => toggleSelectOne(orden.id)}
                    onView={() => handleViewOrder(orden.id)}
                  />
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer con paginación */}
      <div className="border-t bg-muted/20 p-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Mostrando {filteredAndSorted.length} de {totalCount ?? ordenes.length} {(totalCount ?? ordenes.length) === 1 ? "orden" : "órdenes"}
          </div>
          {totalPages && totalPages > 1 ? (
            <div className="flex items-center space-x-2">
              <Link href={`/admin/ordenes?page=${Math.max(1, (currentPage || 1) - 1)}`}>
                <EnhancedButton variant="outline" size="sm" disabled={(currentPage || 1) <= 1}>
                  Anterior
                </EnhancedButton>
              </Link>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, Math.min((currentPage || 1) - 2, totalPages - 4));
                const page = start + i;
                if (page > totalPages) return null;
                return (
                  <Link key={page} href={`/admin/ordenes?page=${page}`}>
                    <span className={`px-3 py-1 rounded-md text-xs cursor-pointer ${
                      page === (currentPage || 1)
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}>
                      {page}
                    </span>
                  </Link>
                );
              })}
              <Link href={`/admin/ordenes?page=${Math.min(totalPages, (currentPage || 1) + 1)}`}>
                <EnhancedButton variant="outline" size="sm" disabled={(currentPage || 1) >= totalPages}>
                  Siguiente
                </EnhancedButton>
              </Link>
            </div>
          ) : (
            <span className="text-xs">P&aacute;gina 1 de 1</span>
          )}
        </div>
      </div>
    </EnhancedCard>
  );
}
