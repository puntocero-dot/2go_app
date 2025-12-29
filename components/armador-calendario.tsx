"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import {
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  Clock,
  User,
  Calendar,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
  isPast,
  isFuture,
} from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";

interface OrdenCalendario {
  id: string;
  codigoReferenciaRetail: string;
  estado: string;
  proyecto: string;
  cliente: string;
  direccion: string;
  municipio: string;
  fechaSolicitada: string;
  prioridad: string;
}

interface DiaOrdenes {
  fecha: Date;
  ordenes: OrdenCalendario[];
}

export function ArmadorCalendario() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [ordenes, setOrdenes] = useState<OrdenCalendario[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrdenes();
  }, [currentMonth]);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      const inicio = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const fin = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const response = await fetch(
        `/api/armadores/calendario?inicio=${inicio}&fin=${fin}`
      );
      if (response.ok) {
        const data = await response.json();
        setOrdenes(data.ordenes || []);
      }
    } catch (error) {
      console.error("Error fetching ordenes:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  };

  const getOrdenesForDay = (date: Date): OrdenCalendario[] => {
    const dateStr = format(date, "yyyy-MM-dd");
    return ordenes.filter((o) => o.fechaSolicitada.startsWith(dateStr));
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "SIN_ASIGNAR":
        return "bg-gray-100 text-gray-800";
      case "ASIGNADO":
        return "bg-blue-100 text-blue-800";
      case "EN_RUTA":
        return "bg-yellow-100 text-yellow-800";
      case "ARMADO_INICIADO":
        return "bg-purple-100 text-purple-800";
      case "ARMADO_COMPLETADO":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPrioridadColor = (prioridad: string) => {
    switch (prioridad) {
      case "VIP":
        return "bg-red-500 text-white";
      case "URGENTE":
        return "bg-orange-500 text-white";
      case "MEDIA":
        return "bg-yellow-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const days = getDaysInMonth();
  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Estadísticas
  const stats = {
    total: ordenes.length,
    pendientes: ordenes.filter((o) =>
      ["SIN_ASIGNAR", "ASIGNADO"].includes(o.estado)
    ).length,
    enProceso: ordenes.filter((o) =>
      ["EN_RUTA", "ARMADO_INICIADO"].includes(o.estado)
    ).length,
    completadas: ordenes.filter((o) => o.estado === "ARMADO_COMPLETADO").length,
  };

  const ordenesDelDia = selectedDate ? getOrdenesForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <EnhancedButton
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </EnhancedButton>
          <h2 className="text-xl font-semibold min-w-[200px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: es })}
          </h2>
          <EnhancedButton
            variant="outline"
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </EnhancedButton>
        </div>

        <EnhancedButton
          variant="outline"
          onClick={() => {
            setCurrentMonth(new Date());
            setSelectedDate(new Date());
          }}
        >
          Hoy
        </EnhancedButton>
      </div>

      {/* Estadísticas del mes */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total órdenes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{stats.pendientes}</p>
                <p className="text-xs text-muted-foreground">Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.enProceso}</p>
                <p className="text-xs text-muted-foreground">En proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.completadas}</p>
                <p className="text-xs text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Header días de la semana */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const dayOrdenes = getOrdenesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasUrgent = dayOrdenes.some(
                  (o) => o.prioridad === "VIP" || o.prioridad === "URGENTE"
                );

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      min-h-[80px] p-2 border rounded-lg cursor-pointer transition-all
                      ${!isCurrentMonth ? "opacity-40 bg-gray-50" : "bg-white"}
                      ${isToday(day) ? "ring-2 ring-primary" : ""}
                      ${isSelected ? "ring-2 ring-blue-500 bg-blue-50" : ""}
                      ${isPast(day) && !isToday(day) ? "bg-gray-50" : ""}
                      ${hasUrgent ? "border-red-300" : ""}
                      hover:shadow-md
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={`text-sm font-medium ${
                          isToday(day)
                            ? "bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center"
                            : ""
                        }`}
                      >
                        {format(day, "d")}
                      </span>
                      {dayOrdenes.length > 0 && (
                        <Badge
                          variant="secondary"
                          className={`text-xs px-1 ${
                            hasUrgent ? "bg-red-100 text-red-800" : ""
                          }`}
                        >
                          {dayOrdenes.length}
                        </Badge>
                      )}
                    </div>

                    {/* Preview de órdenes */}
                    <div className="space-y-0.5">
                      {dayOrdenes.slice(0, 2).map((orden) => (
                        <div
                          key={orden.id}
                          className={`text-xs truncate px-1 py-0.5 rounded ${getEstadoColor(
                            orden.estado
                          )}`}
                        >
                          {orden.codigoReferenciaRetail}
                        </div>
                      ))}
                      {dayOrdenes.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayOrdenes.length - 2} más
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Detalle del día seleccionado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5" />
              {selectedDate
                ? format(selectedDate, "EEEE d", { locale: es })
                : "Selecciona un día"}
            </CardTitle>
            {selectedDate && (
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "MMMM yyyy", { locale: es })}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {ordenesDelDia.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No hay órdenes para este día</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {ordenesDelDia.map((orden) => (
                  <Link
                    key={orden.id}
                    href={`/armador/ordenes/${orden.id}`}
                    className="block"
                  >
                    <div className="border rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-mono text-sm font-medium">
                            #{orden.codigoReferenciaRetail}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {orden.proyecto}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {orden.prioridad !== "NORMAL" && (
                            <Badge
                              className={`text-xs ${getPrioridadColor(
                                orden.prioridad
                              )}`}
                            >
                              {orden.prioridad}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span className="truncate">{orden.cliente}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{orden.municipio}</span>
                        </div>
                      </div>

                      <div className="mt-2">
                        <Badge className={getEstadoColor(orden.estado)}>
                          {orden.estado.replace(/_/g, " ")}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
