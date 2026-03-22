"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedButton } from "@/components/ui/enhanced-button";
import { Label } from "@/components/ui/label";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  X,
  AlertTriangle,
  Plus,
  Calendar,
  Users,
  Upload,
} from "lucide-react";
import { HorariosCargaMasiva } from "@/components/horarios-carga-masiva";
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
  getDay,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  isWeekend,
  isSameWeek,
} from "date-fns";
import { es } from "date-fns/locale";

interface Armador {
  id: string;
  nombre: string;
}

interface HorarioProgramado {
  id: string;
  armadorId: string;
  armadorNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  tipoTurno: string;
  notas: string | null;
}

interface TurnoReal {
  id: string;
  armadorId: string;
  armadorNombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  duracionMinutos: number;
}

interface DiaData {
  fecha: Date;
  programados: HorarioProgramado[];
  reales: TurnoReal[];
}

interface TurnosCalendarioProps {
  armadores: Armador[];
}

export function TurnosCalendario({ armadores }: TurnosCalendarioProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [horariosProgramados, setHorariosProgramados] = useState<HorarioProgramado[]>([]);
  const [turnosReales, setTurnosReales] = useState<TurnoReal[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedArmador, setSelectedArmador] = useState("ALL");

  // Form para agregar horario
  const [formData, setFormData] = useState({
    armadorId: "",
    fecha: "",
    horaInicio: "08:00",
    horaFin: "17:00",
    tipoTurno: "NORMAL",
    notas: "",
  });

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const inicio = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const fin = format(endOfMonth(currentMonth), "yyyy-MM-dd");

      const response = await fetch(
        `/api/turnos/calendario?inicio=${inicio}&fin=${fin}`
      );
      if (response.ok) {
        const data = await response.json();
        setHorariosProgramados(data.horariosProgramados || []);
        setTurnosReales(data.turnosReales || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHorario = async () => {
    try {
      const response = await fetch("/api/turnos/horarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          armadorId: "",
          fecha: "",
          horaInicio: "08:00",
          horaFin: "17:00",
          tipoTurno: "NORMAL",
          notas: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error adding horario:", error);
    }
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const getDayData = (date: Date): DiaData => {
    const dateStr = format(date, "yyyy-MM-dd");
    
    const filteredProgramados = horariosProgramados.filter((h) => {
      const matches = h.fecha.startsWith(dateStr);
      if (selectedArmador !== "ALL") {
        return matches && h.armadorId === selectedArmador;
      }
      return matches;
    });

    const filteredReales = turnosReales.filter((t) => {
      const matches = t.fecha.startsWith(dateStr);
      if (selectedArmador !== "ALL") {
        return matches && t.armadorId === selectedArmador;
      }
      return matches;
    });

    return {
      fecha: date,
      programados: filteredProgramados,
      reales: filteredReales,
    };
  };

  const getStatusColor = (dayData: DiaData) => {
    if (dayData.programados.length === 0 && dayData.reales.length === 0) {
      return "bg-gray-50";
    }

    const allMatched = dayData.programados.every((prog) =>
      dayData.reales.some((real) => real.armadorId === prog.armadorId)
    );

    if (dayData.programados.length > 0 && dayData.reales.length === 0) {
      return "bg-red-50 border-red-200";
    }

    if (allMatched && dayData.programados.length > 0) {
      return "bg-green-50 border-green-200";
    }

    if (dayData.reales.length > dayData.programados.length) {
      return "bg-blue-50 border-blue-200";
    }

    return "bg-yellow-50 border-yellow-200";
  };

  const weekDays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  // Calcular estadísticas - si hay día seleccionado, mostrar del día; si no, del mes
  const getStats = () => {
    let filteredProgramados = horariosProgramados;
    let filteredReales = turnosReales;

    // Filtrar por armador seleccionado
    if (selectedArmador !== "ALL") {
      filteredProgramados = filteredProgramados.filter(h => h.armadorId === selectedArmador);
      filteredReales = filteredReales.filter(t => t.armadorId === selectedArmador);
    }

    // Si hay día seleccionado, filtrar por ese día
    if (selectedDate) {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      filteredProgramados = filteredProgramados.filter(h => h.fecha.startsWith(dateStr));
      filteredReales = filteredReales.filter(t => t.fecha.startsWith(dateStr));
    }

    return {
      diasProgramados: new Set(filteredProgramados.map((h) => h.fecha.split("T")[0])).size,
      diasTrabajados: new Set(filteredReales.map((t) => t.fecha.split("T")[0])).size,
      horasProgramadas: filteredProgramados.reduce((acc, h) => {
        const [hi, mi] = h.horaInicio.split(":").map(Number);
        const [hf, mf] = h.horaFin.split(":").map(Number);
        return acc + (hf * 60 + mf - hi * 60 - mi) / 60;
      }, 0),
      horasTrabajadas: filteredReales.reduce((acc, t) => acc + t.duracionMinutos / 60, 0),
    };
  };

  const stats = getStats();
  const statsLabel = selectedDate 
    ? format(selectedDate, "d 'de' MMMM", { locale: es })
    : format(currentMonth, "MMMM yyyy", { locale: es });

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

        <div className="flex items-center gap-3">
          <select
            value={selectedArmador}
            onChange={(e) => setSelectedArmador(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">Todos los armadores</option>
            {armadores.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nombre}
              </option>
            ))}
          </select>

          <EnhancedButton onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Programar Horario
          </EnhancedButton>
        </div>
      </div>

      {/* Estadísticas - del día seleccionado o del mes */}
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Estadísticas de: <span className="font-medium text-foreground">{statsLabel}</span>
          {selectedDate && (
            <button 
              onClick={() => setSelectedDate(null)} 
              className="ml-2 text-blue-600 hover:underline text-xs"
            >
              (ver mes completo)
            </button>
          )}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.diasProgramados}</p>
                  <p className="text-xs text-muted-foreground">Días programados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.diasTrabajados}</p>
                  <p className="text-xs text-muted-foreground">Días trabajados</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.horasProgramadas.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Horas programadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold">{stats.horasTrabajadas.toFixed(1)}h</p>
                  <p className="text-xs text-muted-foreground">Horas trabajadas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 border border-green-300"></div>
          <span>Cumplido</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 border border-red-300"></div>
          <span>No se presentó</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-300"></div>
          <span>Parcial</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300"></div>
          <span>Extra (sin programar)</span>
        </div>
      </div>

      {/* Calendario */}
      <Card>
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
              const dayData = getDayData(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    min-h-[100px] p-2 border rounded-lg cursor-pointer transition-all
                    ${!isCurrentMonth ? "opacity-40" : ""}
                    ${isToday(day) ? "ring-2 ring-primary" : ""}
                    ${isSelected ? "ring-2 ring-blue-500" : ""}
                    ${getStatusColor(dayData)}
                    hover:shadow-md
                  `}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium ${
                        isToday(day) ? "text-primary" : ""
                      }`}
                    >
                      {format(day, "d")}
                    </span>
                    {dayData.programados.length > 0 && (
                      <Badge variant="outline" className="text-xs px-1">
                        {dayData.programados.length}P
                      </Badge>
                    )}
                  </div>

                  {/* Indicadores */}
                  <div className="space-y-1">
                    {dayData.programados.slice(0, 2).map((prog) => {
                      const cumplido = dayData.reales.some(
                        (r) => r.armadorId === prog.armadorId
                      );
                      return (
                        <div
                          key={prog.id}
                          className={`text-xs truncate px-1 py-0.5 rounded ${
                            cumplido
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {prog.armadorNombre.split(" ")[0]}
                        </div>
                      );
                    })}
                    {dayData.programados.length > 2 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayData.programados.length - 2} más
                      </div>
                    )}
                    {dayData.reales.length > 0 &&
                      dayData.programados.length === 0 && (
                        <div className="text-xs bg-blue-200 text-blue-800 px-1 py-0.5 rounded truncate">
                          {dayData.reales.length} extra
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
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              {format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const dayData = getDayData(selectedDate);
              
              if (dayData.programados.length === 0 && dayData.reales.length === 0) {
                return (
                  <p className="text-muted-foreground text-center py-8">
                    No hay horarios programados ni turnos registrados para este día
                  </p>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Tabla comparativa */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Armador</th>
                        <th className="text-left py-2">Programado</th>
                        <th className="text-left py-2">Real</th>
                        <th className="text-left py-2">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Mostrar programados */}
                      {dayData.programados.map((prog) => {
                        const real = dayData.reales.find(
                          (r) => r.armadorId === prog.armadorId
                        );
                        return (
                          <tr key={prog.id} className="border-b">
                            <td className="py-2 font-medium">{prog.armadorNombre}</td>
                            <td className="py-2">
                              {prog.horaInicio} - {prog.horaFin}
                            </td>
                            <td className="py-2">
                              {real ? (
                                <>
                                  {real.horaInicio} - {real.horaFin || "En curso"}
                                  <span className="text-muted-foreground ml-2">
                                    ({Math.round(real.duracionMinutos / 60)}h)
                                  </span>
                                </>
                              ) : (
                                <span className="text-red-500">No se presentó</span>
                              )}
                            </td>
                            <td className="py-2">
                              {real ? (
                                <Badge className="bg-green-600">
                                  <Check className="w-3 h-3 mr-1" />
                                  Cumplido
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  <X className="w-3 h-3 mr-1" />
                                  Ausente
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Mostrar turnos extra (sin programar) */}
                      {dayData.reales
                        .filter(
                          (r) =>
                            !dayData.programados.some(
                              (p) => p.armadorId === r.armadorId
                            )
                        )
                        .map((real) => (
                          <tr key={real.id} className="border-b bg-blue-50">
                            <td className="py-2 font-medium">{real.armadorNombre}</td>
                            <td className="py-2 text-muted-foreground">
                              No programado
                            </td>
                            <td className="py-2">
                              {real.horaInicio} - {real.horaFin || "En curso"}
                              <span className="text-muted-foreground ml-2">
                                ({Math.round(real.duracionMinutos / 60)}h)
                              </span>
                            </td>
                            <td className="py-2">
                              <Badge className="bg-blue-600">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Extra
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Vista Semanal tipo Excel - Solo cuando hay armador seleccionado */}
      {selectedArmador !== "ALL" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Vista Semanal - {armadores.find(a => a.id === selectedArmador)?.nombre}
              </CardTitle>
              <div className="flex items-center gap-2">
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(subWeeks(selectedDate || new Date(), 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </EnhancedButton>
                <span className="text-sm font-medium min-w-[180px] text-center">
                  Semana del {format(startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 }), "d MMM", { locale: es })} al {format(endOfWeek(selectedDate || new Date(), { weekStartsOn: 1 }), "d MMM yyyy", { locale: es })}
                </span>
                <EnhancedButton
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(addWeeks(selectedDate || new Date(), 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </EnhancedButton>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1 text-left font-semibold">Tipo</th>
                    <th className="border px-2 py-1 text-left font-semibold">Fecha</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-blue-50">Horario Prog.</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-blue-50">Lunch P.</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-blue-50">Break P.</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-blue-50">Total Hrs P.</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-green-50">Horario Trab.</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-green-50">Lunch</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-green-50">Break</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-green-50">Total Hrs Trab.</th>
                    <th className="border px-2 py-1 text-center font-semibold bg-orange-50">Hrs Extras</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const weekStart = startOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
                    const weekEnd = endOfWeek(selectedDate || new Date(), { weekStartsOn: 1 });
                    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
                    
                    let totalHorasProg = 0;
                    let totalHorasTrab = 0;
                    let totalHorasExtras = 0;

                    const rows = weekDays.map((day) => {
                      const dateStr = format(day, "yyyy-MM-dd");
                      const prog = horariosProgramados.find(
                        h => h.fecha.startsWith(dateStr) && h.armadorId === selectedArmador
                      );
                      const real = turnosReales.find(
                        t => t.fecha.startsWith(dateStr) && t.armadorId === selectedArmador
                      );

                      // Calcular horas programadas
                      let horasProg = 0;
                      if (prog) {
                        const [hi, mi] = prog.horaInicio.split(":").map(Number);
                        const [hf, mf] = prog.horaFin.split(":").map(Number);
                        horasProg = (hf * 60 + mf - hi * 60 - mi) / 60;
                      }

                      // Horas trabajadas
                      const horasTrab = real ? real.duracionMinutos / 60 : 0;

                      // Horas extras (si trabajó más de lo programado, o si trabajó sin programar)
                      const horasExtras = Math.max(0, horasTrab - horasProg);

                      totalHorasProg += horasProg;
                      totalHorasTrab += horasTrab;
                      totalHorasExtras += horasExtras;

                      const getTipo = () => {
                        if (isWeekend(day)) return { label: "Fin de semana", color: "text-gray-500" };
                        if (prog?.tipoTurno === "DESCANSO") return { label: "Descanso", color: "text-purple-600" };
                        return { label: "Hábil", color: "text-gray-900" };
                      };

                      const tipo = getTipo();

                      return (
                        <tr key={dateStr} className={isWeekend(day) ? "bg-gray-50" : ""}>
                          <td className={`border px-2 py-1 ${tipo.color}`}>{tipo.label}</td>
                          <td className="border px-2 py-1">{format(day, "dd/MM/yyyy")}</td>
                          <td className="border px-2 py-1 text-center bg-blue-50/50">
                            {prog ? `${prog.horaInicio} - ${prog.horaFin}` : "-"}
                          </td>
                          <td className="border px-2 py-1 text-center bg-blue-50/50">1:00</td>
                          <td className="border px-2 py-1 text-center bg-blue-50/50">0:15</td>
                          <td className="border px-2 py-1 text-center font-medium bg-blue-50/50">
                            {horasProg > 0 ? horasProg.toFixed(1) : "-"}
                          </td>
                          <td className="border px-2 py-1 text-center bg-green-50/50">
                            {real ? `${real.horaInicio} - ${real.horaFin || "..."}` : "-"}
                          </td>
                          <td className="border px-2 py-1 text-center bg-green-50/50">
                            {real ? "1:00" : "-"}
                          </td>
                          <td className="border px-2 py-1 text-center bg-green-50/50">
                            {real ? "0:15" : "-"}
                          </td>
                          <td className="border px-2 py-1 text-center font-medium bg-green-50/50">
                            {horasTrab > 0 ? horasTrab.toFixed(1) : "-"}
                          </td>
                          <td className={`border px-2 py-1 text-center font-medium bg-orange-50/50 ${horasExtras > 0 ? "text-orange-600" : ""}`}>
                            {horasExtras > 0 ? horasExtras.toFixed(2) : "-"}
                          </td>
                        </tr>
                      );
                    });

                    return (
                      <>
                        {rows}
                        <tr className="bg-gray-200 font-bold">
                          <td colSpan={5} className="border px-2 py-1 text-right">Total semana:</td>
                          <td className="border px-2 py-1 text-center bg-blue-100">{totalHorasProg.toFixed(1)}</td>
                          <td colSpan={3} className="border px-2 py-1"></td>
                          <td className="border px-2 py-1 text-center bg-green-100">{totalHorasTrab.toFixed(1)}</td>
                          <td className="border px-2 py-1 text-center bg-orange-100">{totalHorasExtras.toFixed(2)}</td>
                        </tr>
                      </>
                    );
                  })()}
                </tbody>
              </table>
            </div>
            
            {/* Leyenda de la tabla */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs space-y-1">
              <p><strong>Tipo:</strong> Si es día hábil, feriado, o fin de semana</p>
              <p><strong>Horario Prog.:</strong> Horario programado inicio y fin</p>
              <p><strong>Lunch P. / Break P.:</strong> Hora de comida y descanso programados (teóricos)</p>
              <p><strong>Total Hrs P.:</strong> Total de horas programadas (hora fin - hora inicio - lunch)</p>
              <p><strong>Horario Trab.:</strong> Horario real trabajado</p>
              <p><strong>Hrs Extras:</strong> Horas trabajadas menos horas programadas. Si es mayor a 44h semanales se pagan doble.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Carga Masiva de Horarios */}
      <HorariosCargaMasiva armadores={armadores} />

      {/* Modal para agregar horario */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Programar Horario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Armador</Label>
                <select
                  value={formData.armadorId}
                  onChange={(e) =>
                    setFormData({ ...formData, armadorId: e.target.value })
                  }
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2"
                >
                  <option value="">Seleccionar armador</option>
                  {armadores.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>Fecha</Label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) =>
                    setFormData({ ...formData, fecha: e.target.value })
                  }
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Hora Inicio</Label>
                  <input
                    type="time"
                    value={formData.horaInicio}
                    onChange={(e) =>
                      setFormData({ ...formData, horaInicio: e.target.value })
                    }
                    className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2"
                  />
                </div>
                <div>
                  <Label>Hora Fin</Label>
                  <input
                    type="time"
                    value={formData.horaFin}
                    onChange={(e) =>
                      setFormData({ ...formData, horaFin: e.target.value })
                    }
                    className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <Label>Tipo de Turno</Label>
                <select
                  value={formData.tipoTurno}
                  onChange={(e) =>
                    setFormData({ ...formData, tipoTurno: e.target.value })
                  }
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2"
                >
                  <option value="NORMAL">Normal</option>
                  <option value="EXTRA">Extra</option>
                  <option value="MEDIO_TIEMPO">Medio Tiempo</option>
                  <option value="DESCANSO">Descanso</option>
                </select>
              </div>

              <div>
                <Label>Notas (opcional)</Label>
                <input
                  type="text"
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData({ ...formData, notas: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                  className="w-full mt-1 rounded-lg border border-input bg-background px-3 py-2"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <EnhancedButton
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </EnhancedButton>
                <EnhancedButton
                  className="flex-1"
                  onClick={handleAddHorario}
                  disabled={!formData.armadorId || !formData.fecha}
                >
                  Guardar
                </EnhancedButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
