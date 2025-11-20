'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TipoReglaPrincipal = "COBRO_FIJO_UNITARIO" | "COBRO_POR_VOLUMEN";
export type TipoPenalizacion = "CLIENTE_NO_CONTESTO" | "PEDIDO_CANCELADO_EN_RUTA";

type RangoVolumen = { id?: string; desde: number; hasta?: number | null; precio: number; };
type CobroDistancia = { id?: string; municipio: string; precio: number; };
type Penalizacion = { id?: string; tipo: TipoPenalizacion; precio: number; };

type ReglaCobro = {
  id?: string;
  tipoPrincipal: TipoReglaPrincipal;
  precioFijoUnitario?: number | null;
  precioVIP: number;
  precioUrgente: number;
  precioMedia: number;
  precioNormal: number;
  precioGrande: number;
  precioMediano: number;
  precioPequeno: number;
  rangosVolumen: RangoVolumen[];
  cobrosDistancia: CobroDistancia[];
  penalizaciones: Penalizacion[];
};

type ProjectBillingManagerProps = {
  projectId: string;
  initialRule: ReglaCobro | null;
};

type SaveStatus = "idle" | "saving";
type MessageState = { type: "success" | "error" | "info" | null; text?: string; };

const PRIORIDAD_FIELDS = [
  { key: "precioVIP", label: "VIP" },
  { key: "precioUrgente", label: "URGENTE" },
  { key: "precioMedia", label: "MEDIA" },
  { key: "precioNormal", label: "NORMAL" },
] as const;

const TAMANO_FIELDS = [
  { key: "precioGrande", label: "GRANDE" },
  { key: "precioMediano", label: "MEDIANO" },
  { key: "precioPequeno", label: "PEQUEÑO" },
] as const;

const PENALIZACIONES: TipoPenalizacion[] = [
  "CLIENTE_NO_CONTESTO",
  "PEDIDO_CANCELADO_EN_RUTA",
];

const EMPTY_RULE: ReglaCobro = {
  tipoPrincipal: "COBRO_FIJO_UNITARIO",
  precioFijoUnitario: 0,
  precioVIP: 0,
  precioUrgente: 0,
  precioMedia: 0,
  precioNormal: 0,
  precioGrande: 0,
  precioMediano: 0,
  precioPequeno: 0,
  rangosVolumen: [],
  cobrosDistancia: [],
  penalizaciones: PENALIZACIONES.map((tipo) => ({ tipo, precio: 0 })),
};

function ensurePenalizaciones(penalizaciones: Penalizacion[] | undefined) {
  const map = new Map<TipoPenalizacion, Penalizacion>();
  penalizaciones?.forEach((pen) => map.set(pen.tipo, pen));
  return PENALIZACIONES.map((tipo) => map.get(tipo) ?? { tipo, precio: 0 });
}

function toNumber(raw: string): number {
  if (!raw.trim()) return 0;
  const parsed = Number(raw.replace(/,/g, "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeRule(source: ReglaCobro | null): ReglaCobro {
  const partialSource: Partial<ReglaCobro> = source ?? {};
  return {
    ...EMPTY_RULE,
    ...partialSource,
    precioFijoUnitario: partialSource.precioFijoUnitario ?? 0,
    rangosVolumen: partialSource.rangosVolumen ?? [],
    cobrosDistancia: partialSource.cobrosDistancia ?? [],
    penalizaciones: ensurePenalizaciones(partialSource.penalizaciones),
  };
}

function createPriorityInputState(source: ReglaCobro) {
  const entries: Record<string, string> = {};
  PRIORIDAD_FIELDS.forEach(({ key }) => {
    entries[key] = String((source as any)[key] ?? 0);
  });
  TAMANO_FIELDS.forEach(({ key }) => {
    entries[key] = String((source as any)[key] ?? 0);
  });
  return entries;
}

function createPenalizacionInputState(source: ReglaCobro): Record<TipoPenalizacion, string> {
  const base: Record<TipoPenalizacion, string> = {
    CLIENTE_NO_CONTESTO: "0",
    PEDIDO_CANCELADO_EN_RUTA: "0",
  };
  source.penalizaciones.forEach((pen) => {
    base[pen.tipo] = String(pen.precio ?? 0);
  });
  return base;
}

type RangoInputState = { desde: string; hasta: string; precio: string; };
function createRangosInputState(source: ReglaCobro): RangoInputState[] {
  return source.rangosVolumen.map((rango) => ({
    desde: String(rango.desde ?? 0),
    hasta: rango.hasta === null || rango.hasta === undefined ? "" : String(rango.hasta),
    precio: String(rango.precio ?? 0),
  }));
}

export function ProjectBillingManager({ projectId, initialRule }: ProjectBillingManagerProps) {
  const normalizedInitial = normalizeRule(initialRule);
  const [rule, setRule] = useState<ReglaCobro>(normalizedInitial);
  const [manualMunicipio, setManualMunicipio] = useState("");
  const [manualMunicipioPrecio, setManualMunicipioPrecio] = useState("0");
  const [csvMunicipios, setCsvMunicipios] = useState("");
  const [csvWarnings, setCsvWarnings] = useState<string[]>([]);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [message, setMessage] = useState<MessageState>({ type: null });

  const [precioFijoInput, setPrecioFijoInput] = useState(() => String(normalizedInitial.precioFijoUnitario ?? 0));
  const [priorityInputs, setPriorityInputs] = useState(() => createPriorityInputState(normalizedInitial));
  const [penalizacionInputs, setPenalizacionInputs] = useState<Record<TipoPenalizacion, string>>(() => createPenalizacionInputState(normalizedInitial));
  const [rangoInputs, setRangoInputs] = useState<RangoInputState[]>(() => createRangosInputState(normalizedInitial));
  const [municipioInputs, setMunicipioInputs] = useState<string[]>(() => normalizedInitial.cobrosDistancia.map((c) => String(c.precio)));

  useEffect(() => {
    const normalized = normalizeRule(initialRule);
    setRule(normalized);
    setPrecioFijoInput(String(normalized.precioFijoUnitario ?? 0));
    setPriorityInputs(createPriorityInputState(normalized));
    setPenalizacionInputs(createPenalizacionInputState(normalized));
    setRangoInputs(createRangosInputState(normalized));
    setMunicipioInputs(normalized.cobrosDistancia.map((c) => String(c.precio)));
    setManualMunicipioPrecio("0");
  }, [initialRule]);

  const commitPenalizacion = (tipo: TipoPenalizacion, raw: string) => {
    setPenalizacionInputs((prev) => ({ ...prev, [tipo]: raw }));
    const safeValue = toNumber(raw);
    setRule((prev) => {
      const existing = prev.penalizaciones.find((pen) => pen.tipo === tipo);
      if (existing) {
        existing.precio = safeValue;
        return { ...prev, penalizaciones: [...prev.penalizaciones] };
      }
      return { ...prev, penalizaciones: [...prev.penalizaciones, { tipo, precio: safeValue }] };
    });
  };

  const addRange = () => {
    const newRange: RangoVolumen = { id: `temp-${Date.now()}-${Math.random()}`, desde: 0, hasta: null, precio: 0 };
    setRule((prev) => ({ ...prev, rangosVolumen: [...prev.rangosVolumen, newRange] }));
    setRangoInputs((prev) => [...prev, { desde: "0", hasta: "", precio: "0" }]);
  };

  const removeRange = (index: number) => {
    setRule((prev) => ({ ...prev, rangosVolumen: prev.rangosVolumen.filter((_, idx) => idx !== index) }));
    setRangoInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  // CORREGIDO: mergeCobros ahora actualiza AMBOS estados correctamente
  const mergeCobros = (nuevos: CobroDistancia[]) => {
    setRule((prev) => {
      const map = new Map<string, CobroDistancia>();
      prev.cobrosDistancia.forEach((item) => map.set(item.municipio.trim().toLowerCase(), item));
      nuevos.forEach((item) => map.set(item.municipio.trim().toLowerCase(), item));

      const updatedCobros = Array.from(map.values());
      // Sincronizar municipioInputs con el nuevo orden
      setMunicipioInputs(updatedCobros.map((c) => String(c.precio)));
      return { ...prev, cobrosDistancia: updatedCobros };
    });
  };

  const handleCsvProcess = () => {
    setCsvWarnings([]);
    if (!csvMunicipios.trim()) {
      setCsvWarnings(["No hay datos para procesar"]);
      return;
    }
    const rows = csvMunicipios.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    if (rows.length === 0) {
      setCsvWarnings(["No se detectaron filas válidas"]);
      return;
    }
    const nuevos: CobroDistancia[] = [];
    const warnings: string[] = [];
    rows.forEach((row, index) => {
      const parts = row.split(",").map((part) => part.trim());
      if (parts.length < 1) {
        warnings.push(`Fila ${index + 1}: formato inválido`);
        return;
      }
      const municipio = parts[0];
      const precio = parts[1] ?? "0";
      if (!municipio) {
        warnings.push(`Fila ${index + 1}: municipio vacío`);
        return;
      }
      const numeric = toNumber(precio);
      nuevos.push({ municipio, precio: numeric });
    });
    mergeCobros(nuevos);
    setCsvWarnings(warnings.length > 0 ? warnings : ["Municipios procesados satisfactoriamente"]);
  };

  const handleAddMunicipioManual = () => {
    if (!manualMunicipio.trim()) {
      setMessage({ type: "error", text: "Debes indicar el nombre del municipio" });
      return;
    }
    mergeCobros([{ municipio: manualMunicipio.trim(), precio: toNumber(manualMunicipioPrecio) }]);
    setManualMunicipio("");
    setManualMunicipioPrecio("0");
    setMessage({ type: "success", text: "Municipio añadido" });
  };

  const removeMunicipio = (index: number) => {
    setRule((prev) => ({ ...prev, cobrosDistancia: prev.cobrosDistancia.filter((_, idx) => idx !== index) }));
    setMunicipioInputs((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = async () => {
    setStatus("saving");
    setMessage({ type: null });
    try {
      const response = await fetch(`/api/proyectos/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          reglaCobro: {
            tipoPrincipal: rule.tipoPrincipal,
            precioFijoUnitario: rule.tipoPrincipal === "COBRO_FIJO_UNITARIO" ? rule.precioFijoUnitario ?? 0 : null,
            precioVIP: rule.precioVIP,
            precioUrgente: rule.precioUrgente,
            precioMedia: rule.precioMedia,
            precioNormal: rule.precioNormal,
            precioGrande: rule.precioGrande,
            precioMediano: rule.precioMediano,
            precioPequeno: rule.precioPequeno,
            rangosVolumen: rule.tipoPrincipal === "COBRO_POR_VOLUMEN"
              ? rule.rangosVolumen.map((r) => ({ id: r.id, desde: r.desde, hasta: r.hasta ?? null, precio: r.precio }))
              : [],
            cobrosDistancia: rule.cobrosDistancia.map((cobro) => ({
              id: cobro.id,
              municipio: cobro.municipio,
              precio: cobro.precio,
            })),
            penalizaciones: rule.penalizaciones.map((pen) => ({
              id: pen.id,
              tipo: pen.tipo,
              precio: pen.precio,
            })),
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo guardar la regla de cobro");
      }

      setStatus("idle");
      setMessage({ type: "success", text: "Regla de cobro guardada" });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error inesperado";
      setStatus("idle");
      setMessage({ type: "error", text: errorMessage });
    }
  };

  // UN SOLO RETURN
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Reglas de facturación</CardTitle>
            <p className="text-sm text-slate-600">
              Configura los precios por tipo de servicio, penalizaciones, rangos y municipios.
            </p>
          </div>
          <div className="flex gap-2">
            {message.type && (
              <span
                className={
                  message.type === "success"
                    ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                    : message.type === "error"
                    ? "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                    : "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                }
              >
                {message.text}
              </span>
            )}
            <Button onClick={handleSave} disabled={status === "saving"}>
              {status === "saving" ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tipo de regla principal */}
        <section className="grid gap-4 md:grid-cols-[minmax(0,320px),1fr]">
          <div className="space-y-3 rounded-md border border-gray-200 p-4">
            <Label>Tipo de regla principal</Label>
            <div className="grid gap-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2">
                <input
                  type="radio"
                  name="tipo-principal"
                  value="COBRO_FIJO_UNITARIO"
                  checked={rule.tipoPrincipal === "COBRO_FIJO_UNITARIO"}
                  onChange={() => setRule((prev) => ({ ...prev, tipoPrincipal: "COBRO_FIJO_UNITARIO" }))}
                />
                <div>
                  <p className="text-sm font-medium">Cobro fijo unitario</p>
                  <p className="text-xs text-slate-600">Se cobra lo mismo por cada orden sin importar el volumen.</p>
                </div>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2">
                <input
                  type="radio"
                  name="tipo-principal"
                  value="COBRO_POR_VOLUMEN"
                  checked={rule.tipoPrincipal === "COBRO_POR_VOLUMEN"}
                  onChange={() => setRule((prev) => ({ ...prev, tipoPrincipal: "COBRO_POR_VOLUMEN" }))}
                />
                <div>
                  <p className="text-sm font-medium">Cobro por volumen</p>
                  <p className="text-xs text-slate-600">Define rangos de volumen con precios escalonados.</p>
                </div>
              </label>
            </div>

            {rule.tipoPrincipal === "COBRO_FIJO_UNITARIO" && (
              <div className="space-y-2">
                <Label>Costo por orden</Label>
                <Input
                  inputMode="decimal"
                  value={precioFijoInput}
                  onChange={(e) => setPrecioFijoInput(e.target.value)}
                  onBlur={(e) => {
                    const value = toNumber(e.target.value);
                    setRule((prev) => ({ ...prev, precioFijoUnitario: value }));
                    setPrecioFijoInput(String(value));
                  }}
                />
              </div>
            )}
          </div>

          {/* Prioridades y Tamaños */}
          <div className="space-y-4">
            <div className="rounded-md border border-gray-200 p-4">
              <Label>Prioridades</Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {PRIORIDAD_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      inputMode="decimal"
                      value={priorityInputs[key]}
                      onChange={(e) => setPriorityInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                      onBlur={(e) => {
                        const value = toNumber(e.target.value);
                        setRule((prev) => ({ ...prev, [key]: value }));
                        setPriorityInputs((prev) => ({ ...prev, [key]: String(value) }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-gray-200 p-4">
              <Label>Tamaños</Label>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {TAMANO_FIELDS.map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      inputMode="decimal"
                      value={priorityInputs[key]}
                      onChange={(e) => setPriorityInputs((prev) => ({ ...prev, [key]: e.target.value }))}
                      onBlur={(e) => {
                        const value = toNumber(e.target.value);
                        setRule((prev) => ({ ...prev, [key]: value }));
                        setPriorityInputs((prev) => ({ ...prev, [key]: String(value) }));
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Rangos por volumen */}
        {rule.tipoPrincipal === "COBRO_POR_VOLUMEN" && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Label>Rangos por volumen</Label>
                <p className="text-xs text-slate-600">
                  Define tramos de cantidad y su precio. Empieza agregando al menos un rango.
                </p>
              </div>
              <Button
                size="sm"
                className="bg-vibrant-cyan text-white hover:bg-vibrant-cyan/90"
                onClick={addRange}
              >
                Agregar rango
              </Button>
            </div>
            {rangoInputs.length > 0 ? (
              <div className="space-y-3">
                {rangoInputs.map((inputValues, index) => {
                  const rangoId = rule.rangosVolumen[index]?.id ?? `rango-${index}`;
                  return (
                    <div key={rangoId} className="rounded-md border p-3">
                      <div className="grid gap-3 md:grid-cols-4">
                        <div className="space-y-1">
                          <Label>Desde</Label>
                          <Input
                            inputMode="decimal"
                            value={inputValues.desde}
                            onChange={(e) => setRangoInputs((prev) => {
                              const next = [...prev];
                              next[index].desde = e.target.value;
                              return next;
                            })}
                            onBlur={(e) => {
                              const value = toNumber(e.target.value);
                              setRule((prev) => {
                                const rangos = [...prev.rangosVolumen];
                                rangos[index] = { ...rangos[index], desde: value };
                                return { ...prev, rangosVolumen: rangos };
                              });
                              setRangoInputs((prev) => {
                                const next = [...prev];
                                next[index].desde = String(value);
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Hasta</Label>
                          <Input
                            inputMode="decimal"
                            value={inputValues.hasta}
                            placeholder="Ilimitado"
                            onChange={(e) => setRangoInputs((prev) => {
                              const next = [...prev];
                              next[index].hasta = e.target.value;
                              return next;
                            })}
                            onBlur={(e) => {
                              const trimmed = e.target.value.trim();
                              const numericValue = trimmed ? toNumber(trimmed) : null;
                              setRule((prev) => {
                                const rangos = [...prev.rangosVolumen];
                                rangos[index] = { ...rangos[index], hasta: numericValue };
                                return { ...prev, rangosVolumen: rangos };
                              });
                              setRangoInputs((prev) => {
                                const next = [...prev];
                                next[index].hasta = numericValue === null ? "" : String(numericValue);
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>Precio</Label>
                          <Input
                            inputMode="decimal"
                            value={inputValues.precio}
                            onChange={(e) => setRangoInputs((prev) => {
                              const next = [...prev];
                              next[index].precio = e.target.value;
                              return next;
                            })}
                            onBlur={(e) => {
                              const value = toNumber(e.target.value);
                              setRule((prev) => {
                                const rangos = [...prev.rangosVolumen];
                                rangos[index] = { ...rangos[index], precio: value };
                                return { ...prev, rangosVolumen: rangos };
                              });
                              setRangoInputs((prev) => {
                                const next = [...prev];
                                next[index].precio = String(value);
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => removeRange(index)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-600">Aún no hay rangos configurados.</p>
            )}
          </section>
        )}

        {/* Penalizaciones */}
        <section className="rounded-md border border-gray-200 p-4">
          <Label>Penalizaciones</Label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {PENALIZACIONES.map((tipo) => (
              <div key={tipo} className="space-y-1">
                <Label className="text-xs">
                  {tipo === "CLIENTE_NO_CONTESTO" ? "Cliente no contestó" : "Pedido cancelado en ruta"}
                </Label>
                <Input
                  inputMode="decimal"
                  value={penalizacionInputs[tipo]}
                  onChange={(e) => setPenalizacionInputs((prev) => ({ ...prev, [tipo]: e.target.value }))}
                  onBlur={(e) => commitPenalizacion(tipo, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Municipios */}
        <section className="space-y-4">
          <Label>Municipios</Label>
          {rule.cobrosDistancia.length > 0 ? (
            <div className="space-y-2">
              {rule.cobrosDistancia.map((cobro, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1.5fr),auto,auto] items-center gap-3"
                >
                  <span className="text-sm font-medium truncate">{cobro.municipio}</span>
                  <Input
                    className="w-24 justify-self-start"
                    inputMode="decimal"
                    value={municipioInputs[index] || "0"}
                    onChange={(e) => {
                      const newInputs = [...municipioInputs];
                      newInputs[index] = e.target.value;
                      setMunicipioInputs(newInputs);
                    }}
                    onBlur={(e) => {
                      const value = toNumber(e.target.value);
                      setRule((prev) => {
                        const updated = [...prev.cobrosDistancia];
                        updated[index] = { ...updated[index], precio: value };
                        return { ...prev, cobrosDistancia: updated };
                      });
                      const newInputs = [...municipioInputs];
                      newInputs[index] = String(value);
                      setMunicipioInputs(newInputs);
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 justify-self-start"
                    onClick={() => removeMunicipio(index)}
                  >
                    Eliminar
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">Aún no hay municipios configurados.</p>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3 rounded-md border border-gray-200 p-3">
              <Label htmlFor="municipio-manual">Agregar municipio manualmente</Label>
              <Input
                id="municipio-manual"
                placeholder="Nombre del municipio"
                value={manualMunicipio}
                onChange={(e) => setManualMunicipio(e.target.value)}
              />
              <Input
                placeholder="Precio"
                inputMode="decimal"
                value={manualMunicipioPrecio}
                onChange={(e) => setManualMunicipioPrecio(e.target.value)}
                onBlur={(e) => {
                  const value = toNumber(e.target.value);
                  setManualMunicipioPrecio(String(value));
                }}
              />
              <Button variant="outline" size="sm" onClick={handleAddMunicipioManual}>
                Agregar municipio
              </Button>
            </div>

            <div className="space-y-3 rounded-md border border-gray-200 p-3">
              <Label htmlFor="csv-municipios">Carga masiva (CSV)</Label>
              <textarea
                id="csv-municipios"
                className="h-32 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-vibrant-cyan focus:outline-none"
                placeholder={"Ejemplo:\nSan Salvador,12.50\nSanta Tecla,-3"}
                value={csvMunicipios}
                onChange={(e) => setCsvMunicipios(e.target.value)}
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCsvProcess}>
                  Procesar CSV
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setCsvMunicipios("")}>
                  Limpiar
                </Button>
              </div>
              {csvWarnings.length > 0 && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <ul className="list-disc space-y-1 pl-4">
                    {csvWarnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}