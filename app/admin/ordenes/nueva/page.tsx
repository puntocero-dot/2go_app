"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type Prioridad = "VIP" | "URGENTE" | "MEDIA" | "NORMAL";
const PRIORIDADES: Prioridad[] = ["VIP", "URGENTE", "MEDIA", "NORMAL"];

export default function NuevaOrdenPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [proyectos, setProyectos] = useState<any[]>([]);
  const [muebles, setMuebles] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    codigoReferenciaRetail: "",
    proyectoId: "",
    muebleId: "",
    usuarioFinalId: "",
    fechaSolicitadaCliente: "",
    autoAsignar: true,
    // Datos del mueble (si es nuevo)
    muebleNuevo: false,
    muebleNombre: "",
    muebleTamano: "MEDIANO" as "GRANDE" | "MEDIANO" | "PEQUENO",
    muebleSKU: "",
    // Datos del cliente (si es nuevo)
    clienteNuevo: false,
    clienteNombre: "",
    clienteTelefono: "",
    clienteEmail: "",
    clienteDireccion: "",
    clienteMunicipio: "",
    clienteDepartamento: "",
    clientePrioridad: "NORMAL" as Prioridad,
    prioridadOrden: "NORMAL" as Prioridad,
  });

  // Cargar proyectos al montar
  useEffect(() => {
    fetchProyectos();
  }, []);

  // Cargar muebles cuando se selecciona un proyecto
  useEffect(() => {
    if (formData.proyectoId) {
      fetchMuebles(formData.proyectoId);
      fetchClientes(formData.proyectoId);
    }
  }, [formData.proyectoId]);

  const fetchProyectos = async () => {
    try {
      const response = await fetch("/api/proyectos");
      const data = await response.json();
      setProyectos(data.proyectos || []);
    } catch (err) {
      console.error("Error cargando proyectos:", err);
    }
  };

  const fetchMuebles = async (proyectoId: string) => {
    try {
      const response = await fetch(`/api/muebles?proyectoId=${proyectoId}`);
      const data = await response.json();
      setMuebles(data.muebles || []);
    } catch (err) {
      console.error("Error cargando muebles:", err);
    }
  };

  const fetchClientes = async (proyectoId: string) => {
    try {
      const response = await fetch(`/api/clientes?proyectoId=${proyectoId}`);
      const data = await response.json();
      setClientes(data.clientes || []);
    } catch (err) {
      console.error("Error cargando clientes:", err);
    }
  };

  const clienteSeleccionado =
    !formData.clienteNuevo && formData.usuarioFinalId
      ? clientes.find((cliente) => cliente.id === formData.usuarioFinalId)
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let muebleId = formData.muebleId;
      let usuarioFinalId = formData.usuarioFinalId;

      if (!formData.muebleNuevo && !muebleId) {
        setError("Selecciona un mueble o marca 'Crear mueble nuevo'.");
        setLoading(false);
        return;
      }

      // Si es mueble nuevo, crearlo primero
      if (formData.muebleNuevo) {
        const muebleResponse = await fetch("/api/muebles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.muebleNombre.trim() || "Mueble sin nombre",
            tamano: formData.muebleTamano,
            descripcion: formData.muebleSKU.trim()
              ? `SKU: ${formData.muebleSKU.trim()}`
              : "",
            proyectoId: formData.proyectoId,
          }),
        });

        const muebleData = await muebleResponse.json();

        if (!muebleResponse.ok) {
          throw new Error(muebleData.error || "Error al crear mueble");
        }

        muebleId = muebleData.mueble.id;
      }

      // Si es cliente nuevo, crearlo primero
      if (formData.clienteNuevo) {
        const clienteResponse = await fetch("/api/clientes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nombre: formData.clienteNombre,
            telefono: formData.clienteTelefono,
            email: formData.clienteEmail,
            direccionCompleta: formData.clienteDireccion,
            municipio: formData.clienteMunicipio,
            departamento: formData.clienteDepartamento,
            proyectoId: formData.proyectoId,
            prioridad: formData.clientePrioridad,
          }),
        });

        const clienteData = await clienteResponse.json();

        if (!clienteResponse.ok) {
          throw new Error(clienteData.error || "Error al crear cliente");
        }

        usuarioFinalId = clienteData.cliente.id;
      }

      // Crear la orden
      const response = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigoReferenciaRetail: formData.codigoReferenciaRetail,
          proyectoId: formData.proyectoId,
          muebleId,
          usuarioFinalId,
          // Siempre enviar string: '' o 'YYYY-MM-DD' del input type="date"
          fechaSolicitadaCliente: formData.fechaSolicitadaCliente || "",
          autoAsignar: formData.autoAsignar,
          prioridad: formData.prioridadOrden,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear orden");
      }

      // Redirigir a la lista de órdenes con confirmación
      router.push("/admin/ordenes?created=1");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <Link href="/admin/ordenes">
            <Button variant="outline" className="mb-4">
              ← Volver a Órdenes
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-deep-navy">Nueva Orden</h1>
          <p className="text-gray-600 mt-2">
            Registra una nueva orden de armado de muebles
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Orden</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Código de Referencia */}
              <div className="space-y-2">
                <Label htmlFor="codigoReferenciaRetail">
                  Código de Referencia <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="codigoReferenciaRetail"
                  value={formData.codigoReferenciaRetail}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      codigoReferenciaRetail: e.target.value,
                    })
                  }
                  placeholder="Ej: ORD-2024-001"
                  required
                />
              </div>

              {/* Proyecto */}
              <div className="space-y-2">
                <Label htmlFor="proyectoId">
                  Proyecto <span className="text-red-500">*</span>
                </Label>
                <select
                  id="proyectoId"
                  value={formData.proyectoId}
                  onChange={(e) =>
                    setFormData({ ...formData, proyectoId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibrant-cyan"
                  required
                >
                  <option value="">Selecciona un proyecto</option>
                  {proyectos.map((proyecto) => (
                    <option key={proyecto.id} value={proyecto.id}>
                      {proyecto.nombreComercial}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prioridadOrden">Prioridad de la orden</Label>
                <select
                  id="prioridadOrden"
                  value={formData.prioridadOrden}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prioridadOrden: e.target.value as Prioridad,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibrant-cyan uppercase"
                >
                  {PRIORIDADES.map((prioridad) => (
                    <option key={prioridad} value={prioridad}>
                      {prioridad}
                    </option>
                  ))}
                </select>
                {!formData.clienteNuevo && clienteSeleccionado && (
                  <p className="text-xs text-gray-500">
                    Prioridad sugerida por el cliente: {clienteSeleccionado.prioridad}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  Esta prioridad impactará el cálculo de cobro del proyecto actual.
                </p>
              </div>

              {/* Mueble */}
              {formData.proyectoId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="muebleId">
                        Mueble {!formData.muebleNuevo && (
                          <span className="text-red-500">*</span>
                        )}
                      </Label>
                      <p className="text-xs text-gray-500">
                        Selecciona un mueble registrado o crea uno nuevo inline.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-medium">
                      <input
                        type="checkbox"
                        checked={formData.muebleNuevo}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            muebleNuevo: e.target.checked,
                            muebleId: "",
                          })
                        }
                        className="rounded"
                      />
                      Crear mueble nuevo
                    </label>
                  </div>

                  {!formData.muebleNuevo ? (
                    <div className="space-y-2">
                      <select
                        id="muebleId"
                        value={formData.muebleId}
                        onChange={(e) =>
                          setFormData({ ...formData, muebleId: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibrant-cyan"
                        required={!formData.muebleNuevo}
                      >
                        <option value="">Selecciona un mueble</option>
                        {muebles.map((mueble) => (
                          <option key={mueble.id} value={mueble.id}>
                            {mueble.nombre} - {mueble.tamano}
                          </option>
                        ))}
                      </select>
                      {muebles.length === 0 && (
                        <p className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
                          No hay muebles registrados para este proyecto. Marca "Crear mueble nuevo" para continuar.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="muebleTamano">Categoría</Label>
                          <select
                            id="muebleTamano"
                            value={formData.muebleTamano}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                muebleTamano: e.target.value as "GRANDE" | "MEDIANO" | "PEQUENO",
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibrant-cyan"
                          >
                            <option value="GRANDE">Grande</option>
                            <option value="MEDIANO">Mediano</option>
                            <option value="PEQUENO">Pequeño</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="muebleSKU">SKU (opcional)</Label>
                          <Input
                            id="muebleSKU"
                            value={formData.muebleSKU}
                            onChange={(e) =>
                              setFormData({ ...formData, muebleSKU: e.target.value })
                            }
                            placeholder="Ej: SKU-12345"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="muebleNombre">Nombre / Modelo</Label>
                        <Input
                          id="muebleNombre"
                          value={formData.muebleNombre}
                          onChange={(e) =>
                            setFormData({ ...formData, muebleNombre: e.target.value })
                          }
                          placeholder="Ej: Sofá 3 plazas"
                        />
                        <p className="text-xs text-gray-500">
                          Si dejas este campo vacío se utilizará "Mueble sin nombre".
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Cliente */}
              {formData.proyectoId && (
                <div className="border-t pt-6">
                  <div className="flex items-center gap-4 mb-4">
                    <h3 className="text-lg font-semibold">Cliente</h3>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.clienteNuevo}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setFormData((prev) => {
                            const clienteActual = clientes.find(
                              (cliente) => cliente.id === prev.usuarioFinalId
                            );
                            return {
                              ...prev,
                              clienteNuevo: checked,
                              usuarioFinalId: checked ? "" : prev.usuarioFinalId,
                              prioridadOrden: checked
                                ? prev.clientePrioridad
                                : clienteActual?.prioridad ?? prev.prioridadOrden,
                            };
                          });
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">Cliente nuevo</span>
                    </label>
                  </div>

                  {!formData.clienteNuevo ? (
                    <div className="space-y-2">
                      <Label htmlFor="usuarioFinalId">
                        Seleccionar Cliente{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <select
                        id="usuarioFinalId"
                        value={formData.usuarioFinalId}
                        onChange={(e) => {
                          const value = e.target.value;
                          const cliente = clientes.find((item) => item.id === value);
                          setFormData((prev) => ({
                            ...prev,
                            usuarioFinalId: value,
                            prioridadOrden: cliente?.prioridad ?? prev.prioridadOrden,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibrant-cyan"
                        required
                      >
                        <option value="">Selecciona un cliente</option>
                        {clientes.map((cliente) => (
                          <option key={cliente.id} value={cliente.id}>
                            {cliente.nombre} - {cliente.municipio}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="clientePrioridad">
                          Prioridad del cliente
                        </Label>
                        <select
                          id="clientePrioridad"
                          value={formData.clientePrioridad}
                          onChange={(e) => {
                            const value = e.target.value as Prioridad;
                            setFormData((prev) => ({
                              ...prev,
                              clientePrioridad: value,
                              prioridadOrden: value,
                            }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-vibrant-cyan uppercase"
                        >
                          {PRIORIDADES.map((prioridad) => (
                            <option key={prioridad} value={prioridad}>
                              {prioridad}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-gray-500">
                          Se guardará para el cliente y se usará como prioridad base de la orden.
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clienteNombre">
                            Nombre <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clienteNombre"
                            value={formData.clienteNombre}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                clienteNombre: e.target.value,
                              })
                            }
                            required={formData.clienteNuevo}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clienteTelefono">
                            Teléfono <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clienteTelefono"
                            value={formData.clienteTelefono}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                clienteTelefono: e.target.value,
                              })
                            }
                            required={formData.clienteNuevo}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clienteEmail">Email</Label>
                        <Input
                          id="clienteEmail"
                          type="email"
                          value={formData.clienteEmail}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clienteEmail: e.target.value,
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="clienteDireccion">
                          Dirección <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="clienteDireccion"
                          value={formData.clienteDireccion}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              clienteDireccion: e.target.value,
                            })
                          }
                          required={formData.clienteNuevo}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="clienteMunicipio">
                            Municipio <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clienteMunicipio"
                            value={formData.clienteMunicipio}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                clienteMunicipio: e.target.value,
                              })
                            }
                            required={formData.clienteNuevo}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clienteDepartamento">
                            Departamento <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id="clienteDepartamento"
                            value={formData.clienteDepartamento}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                clienteDepartamento: e.target.value,
                              })
                            }
                            required={formData.clienteNuevo}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Fecha Solicitada */}
              <div className="space-y-2">
                <Label htmlFor="fechaSolicitadaCliente">
                  Fecha Solicitada por Cliente
                </Label>
                <Input
                  id="fechaSolicitadaCliente"
                  type="date"
                  value={formData.fechaSolicitadaCliente}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fechaSolicitadaCliente: e.target.value,
                    })
                  }
                />
              </div>

              {/* Auto-asignar */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoAsignar"
                  checked={formData.autoAsignar}
                  onChange={(e) =>
                    setFormData({ ...formData, autoAsignar: e.target.checked })
                  }
                  className="rounded"
                />
                <Label htmlFor="autoAsignar" className="cursor-pointer">
                  Asignar automáticamente a un armador disponible
                </Label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-vibrant-cyan hover:bg-vibrant-cyan/90"
                >
                  {loading ? "Creando..." : "Crear Orden"}
                </Button>
                <Link href="/admin/ordenes" className="flex-1">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={loading}
                  >
                    Cancelar
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}