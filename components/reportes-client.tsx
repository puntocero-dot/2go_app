"use client";

import { useState, useEffect } from "react";
import { EnhancedCard } from "@/components/ui/enhanced-card";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Download,
  RefreshCw,
  Filter,
  Table2,
  BarChart3,
  Layers,
  GripVertical,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface ReportesClientProps {
  proyectos: { id: string; nombreComercial: string }[];
  armadores: { id: string; nombre: string }[];
}

type DataSource = "ordenes" | "armadores" | "proyectos" | "turnos" | "facturacion";

interface FieldConfig {
  key: string;
  label: string;
  type: "string" | "number" | "date" | "currency" | "status";
  aggregatable?: boolean;
}

const DATA_SOURCES: Record<DataSource, { label: string; fields: FieldConfig[] }> = {
  ordenes: {
    label: "Órdenes",
    fields: [
      { key: "codigoReferenciaRetail", label: "Código", type: "string" },
      { key: "estado", label: "Estado", type: "status" },
      { key: "proyecto", label: "Proyecto", type: "string" },
      { key: "armador", label: "Armador", type: "string" },
      { key: "cliente", label: "Cliente", type: "string" },
      { key: "municipio", label: "Municipio", type: "string" },
      { key: "prioridad", label: "Prioridad", type: "string" },
      { key: "fechaCreacion", label: "Fecha Creación", type: "date" },
      { key: "fechaCompletado", label: "Fecha Completado", type: "date" },
      { key: "cantidad", label: "Cantidad", type: "number", aggregatable: true },
    ],
  },
  armadores: {
    label: "Armadores",
    fields: [
      { key: "nombre", label: "Nombre", type: "string" },
      { key: "estado", label: "Estado", type: "status" },
      { key: "ordenesActivas", label: "Órdenes Activas", type: "number", aggregatable: true },
      { key: "ordenesCompletadas", label: "Órdenes Completadas", type: "number", aggregatable: true },
      { key: "ultimaActividad", label: "Última Actividad", type: "date" },
    ],
  },
  proyectos: {
    label: "Proyectos",
    fields: [
      { key: "nombreComercial", label: "Nombre", type: "string" },
      { key: "tipoCliente", label: "Tipo Cliente", type: "string" },
      { key: "totalOrdenes", label: "Total Órdenes", type: "number", aggregatable: true },
      { key: "ordenesActivas", label: "Órdenes Activas", type: "number", aggregatable: true },
      { key: "ordenesCompletadas", label: "Completadas", type: "number", aggregatable: true },
    ],
  },
  turnos: {
    label: "Turnos",
    fields: [
      { key: "armador", label: "Armador", type: "string" },
      { key: "estado", label: "Estado", type: "status" },
      { key: "fechaInicio", label: "Inicio", type: "date" },
      { key: "fechaFin", label: "Fin", type: "date" },
      { key: "duracionHoras", label: "Duración (hrs)", type: "number", aggregatable: true },
      { key: "puntosGPS", label: "Puntos GPS", type: "number", aggregatable: true },
    ],
  },
  facturacion: {
    label: "Facturación",
    fields: [
      { key: "proyecto", label: "Proyecto", type: "string" },
      { key: "periodo", label: "Período", type: "string" },
      { key: "ordenesFacturadas", label: "Órdenes", type: "number", aggregatable: true },
      { key: "totalArmado", label: "Total Armado", type: "currency", aggregatable: true },
      { key: "totalDistancia", label: "Total Distancia", type: "currency", aggregatable: true },
      { key: "totalPenalizaciones", label: "Penalizaciones", type: "currency", aggregatable: true },
      { key: "totalFacturado", label: "Total Facturado", type: "currency", aggregatable: true },
    ],
  },
};

type PivotConfig = {
  rows: string[];
  columns: string[];
  values: string[];
  aggregation: "sum" | "count" | "avg";
};

export function ReportesClient({ proyectos, armadores }: ReportesClientProps) {
  const [dataSource, setDataSource] = useState<DataSource>("ordenes");
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [proyectoId, setProyectoId] = useState("ALL");
  const [armadorId, setArmadorId] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");

  // Pivot config
  const [pivotMode, setPivotMode] = useState(false);
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    rows: [],
    columns: [],
    values: [],
    aggregation: "sum",
  });

  // Expandir/colapsar grupos en pivot
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const availableFields = DATA_SOURCES[dataSource].fields;

  useEffect(() => {
    // Seleccionar primeros 5 campos por defecto al cambiar fuente
    setSelectedFields(availableFields.slice(0, 5).map((f) => f.key));
    setData([]);
    setPivotConfig({ rows: [], columns: [], values: [], aggregation: "sum" });
  }, [dataSource]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        source: dataSource,
        fields: selectedFields.join(","),
        ...(fechaInicio && { fechaInicio }),
        ...(fechaFin && { fechaFin }),
        ...(proyectoId !== "ALL" && { proyectoId }),
        ...(armadorId !== "ALL" && { armadorId }),
        ...(estadoFilter !== "ALL" && { estado: estadoFilter }),
      });

      const response = await fetch(`/api/reportes?${params}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al obtener datos");
      }

      setData(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const toggleField = (fieldKey: string) => {
    setSelectedFields((prev) =>
      prev.includes(fieldKey)
        ? prev.filter((f) => f !== fieldKey)
        : [...prev, fieldKey]
    );
  };

  const exportCSV = () => {
    if (data.length === 0) return;

    const headers = selectedFields
      .map((key) => availableFields.find((f) => f.key === key)?.label || key)
      .join(",");

    const rows = data.map((row) =>
      selectedFields
        .map((key) => {
          const value = row[key];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(",")) {
            return `"${value}"`;
          }
          return String(value);
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-${dataSource}-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatValue = (value: unknown, field: FieldConfig) => {
    if (value === null || value === undefined) return "-";

    switch (field.type) {
      case "currency":
        return formatCurrency(Number(value));
      case "date":
        return new Date(String(value)).toLocaleDateString("es-SV", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      case "status":
        return (
          <Badge variant="outline" className="text-xs">
            {String(value).replace(/_/g, " ")}
          </Badge>
        );
      case "number":
        return Number(value).toLocaleString("es-SV");
      default:
        return String(value);
    }
  };

  // Pivot table logic
  const getPivotData = () => {
    if (!pivotMode || pivotConfig.rows.length === 0) return null;

    const grouped: Record<string, Record<string, number>> = {};
    const columnValues = new Set<string>();

    data.forEach((row) => {
      const rowKey = pivotConfig.rows.map((r) => String(row[r] || "N/A")).join(" | ");
      const colKey = pivotConfig.columns.length > 0
        ? pivotConfig.columns.map((c) => String(row[c] || "N/A")).join(" | ")
        : "Total";

      columnValues.add(colKey);

      if (!grouped[rowKey]) {
        grouped[rowKey] = {};
      }

      if (!grouped[rowKey][colKey]) {
        grouped[rowKey][colKey] = 0;
      }

      // Agregar valores
      pivotConfig.values.forEach((valueField) => {
        const val = Number(row[valueField]) || 0;
        switch (pivotConfig.aggregation) {
          case "sum":
            grouped[rowKey][colKey] += val;
            break;
          case "count":
            grouped[rowKey][colKey] += 1;
            break;
          case "avg":
            // Para avg necesitamos tracking adicional
            grouped[rowKey][colKey] += val;
            break;
        }
      });
    });

    return { grouped, columns: Array.from(columnValues).sort() };
  };

  const pivotData = getPivotData();

  return (
    <div className="space-y-6">
      {/* Selector de fuente de datos */}
      <EnhancedCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Table2 className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Fuente de Datos</h3>
        </div>

        <div className="flex flex-wrap gap-2">
          {(Object.keys(DATA_SOURCES) as DataSource[]).map((source) => (
            <EnhancedButton
              key={source}
              variant={dataSource === source ? "default" : "outline"}
              size="sm"
              onClick={() => setDataSource(source)}
            >
              {DATA_SOURCES[source].label}
            </EnhancedButton>
          ))}
        </div>
      </EnhancedCard>

      {/* Filtros */}
      <EnhancedCard className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
            <input
              type="date"
              id="fechaInicio"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="fechaFin">Fecha Fin</Label>
            <input
              type="date"
              id="fechaFin"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <Label htmlFor="proyectoId">Proyecto</Label>
            <select
              id="proyectoId"
              value={proyectoId}
              onChange={(e) => setProyectoId(e.target.value)}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Todos</option>
              {proyectos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreComercial}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="armadorId">Armador</Label>
            <select
              id="armadorId"
              value={armadorId}
              onChange={(e) => setArmadorId(e.target.value)}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Todos</option>
              {armadores.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="estadoFilter">Estado</Label>
            <select
              id="estadoFilter"
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">Todos</option>
              <option value="SIN_ASIGNAR">Sin asignar</option>
              <option value="ASIGNADO">Asignado</option>
              <option value="EN_RUTA">En ruta</option>
              <option value="ARMADO_INICIADO">Armado iniciado</option>
              <option value="ARMADO_COMPLETADO">Completado</option>
            </select>
          </div>
        </div>
      </EnhancedCard>

      {/* Selector de campos */}
      <EnhancedCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Campos a mostrar</h3>
          </div>
          <div className="flex items-center gap-2">
            <EnhancedButton
              variant={pivotMode ? "default" : "outline"}
              size="sm"
              onClick={() => setPivotMode(!pivotMode)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Modo Pivot
            </EnhancedButton>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {availableFields.map((field) => (
            <button
              key={field.key}
              onClick={() => toggleField(field.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedFields.includes(field.key)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {field.label}
              {field.aggregatable && (
                <span className="ml-1 text-xs opacity-70">Σ</span>
              )}
            </button>
          ))}
        </div>

        {/* Configuración Pivot */}
        {pivotMode && (
          <div className="mt-6 pt-6 border-t space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">
              Configuración de Tabla Dinámica
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs">Filas (Agrupar por)</Label>
                <select
                  multiple
                  value={pivotConfig.rows}
                  onChange={(e) =>
                    setPivotConfig((prev) => ({
                      ...prev,
                      rows: Array.from(e.target.selectedOptions, (o) => o.value),
                    }))
                  }
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm h-24"
                >
                  {availableFields
                    .filter((f) => f.type === "string" || f.type === "status")
                    .map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Columnas (Dividir por)</Label>
                <select
                  multiple
                  value={pivotConfig.columns}
                  onChange={(e) =>
                    setPivotConfig((prev) => ({
                      ...prev,
                      columns: Array.from(e.target.selectedOptions, (o) => o.value),
                    }))
                  }
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm h-24"
                >
                  {availableFields
                    .filter((f) => f.type === "string" || f.type === "status")
                    .map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Valores (Agregar)</Label>
                <select
                  multiple
                  value={pivotConfig.values}
                  onChange={(e) =>
                    setPivotConfig((prev) => ({
                      ...prev,
                      values: Array.from(e.target.selectedOptions, (o) => o.value),
                    }))
                  }
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm h-24"
                >
                  {availableFields
                    .filter((f) => f.aggregatable)
                    .map((f) => (
                      <option key={f.key} value={f.key}>
                        {f.label}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <Label className="text-xs">Agregación</Label>
                <select
                  value={pivotConfig.aggregation}
                  onChange={(e) =>
                    setPivotConfig((prev) => ({
                      ...prev,
                      aggregation: e.target.value as "sum" | "count" | "avg",
                    }))
                  }
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="sum">Suma</option>
                  <option value="count">Conteo</option>
                  <option value="avg">Promedio</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </EnhancedCard>

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <EnhancedButton
          onClick={fetchData}
          disabled={loading || selectedFields.length === 0}
          className="bg-gradient-to-r from-blue-600 to-purple-600"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Generar Reporte
        </EnhancedButton>

        <EnhancedButton
          variant="outline"
          onClick={exportCSV}
          disabled={data.length === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </EnhancedButton>

        {data.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {data.length} registros
          </Badge>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Tabla de resultados */}
      {data.length > 0 && (
        <EnhancedCard className="overflow-hidden">
          {pivotMode && pivotData ? (
            // Tabla Pivot
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">
                      {pivotConfig.rows
                        .map((r) => availableFields.find((f) => f.key === r)?.label)
                        .join(" / ")}
                    </TableHead>
                    {pivotData.columns.map((col) => (
                      <TableHead key={col} className="font-semibold text-right">
                        {col}
                      </TableHead>
                    ))}
                    <TableHead className="font-semibold text-right bg-muted">
                      Total
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(pivotData.grouped).map(([rowKey, values]) => {
                    const rowTotal = Object.values(values).reduce((a, b) => a + b, 0);
                    return (
                      <TableRow key={rowKey} className="hover:bg-muted/30">
                        <TableCell className="font-medium">{rowKey}</TableCell>
                        {pivotData.columns.map((col) => (
                          <TableCell key={col} className="text-right tabular-nums">
                            {(values[col] || 0).toLocaleString("es-SV", {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-semibold bg-muted/50 tabular-nums">
                          {rowTotal.toLocaleString("es-SV", {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Fila de totales */}
                  <TableRow className="bg-muted font-semibold">
                    <TableCell>Total General</TableCell>
                    {pivotData.columns.map((col) => {
                      const colTotal = Object.values(pivotData.grouped).reduce(
                        (sum, row) => sum + (row[col] || 0),
                        0
                      );
                      return (
                        <TableCell key={col} className="text-right tabular-nums">
                          {colTotal.toLocaleString("es-SV", {
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-right tabular-nums">
                      {Object.values(pivotData.grouped)
                        .reduce(
                          (sum, row) =>
                            sum + Object.values(row).reduce((a, b) => a + b, 0),
                          0
                        )
                        .toLocaleString("es-SV", { maximumFractionDigits: 2 })}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            // Tabla normal
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {selectedFields.map((fieldKey) => {
                      const field = availableFields.find((f) => f.key === fieldKey);
                      return (
                        <TableHead key={fieldKey} className="font-semibold">
                          {field?.label || fieldKey}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/30">
                      {selectedFields.map((fieldKey) => {
                        const field = availableFields.find((f) => f.key === fieldKey);
                        return (
                          <TableCell key={fieldKey}>
                            {field ? formatValue(row[fieldKey], field) : String(row[fieldKey] || "-")}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </EnhancedCard>
      )}

      {/* Estado vacío */}
      {!loading && data.length === 0 && !error && (
        <EnhancedCard className="p-12 text-center">
          <Table2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Sin datos</h3>
          <p className="text-muted-foreground">
            Selecciona los campos y haz clic en &quot;Generar Reporte&quot; para ver los resultados
          </p>
        </EnhancedCard>
      )}
    </div>
  );
}
