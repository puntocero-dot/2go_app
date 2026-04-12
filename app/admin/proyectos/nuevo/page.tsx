"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function NuevoProyectoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [tipoCliente, setTipoCliente] = useState<"CREDITO_FISCAL" | "CONSUMIDOR_FINAL">("CREDITO_FISCAL");
  const [formData, setFormData] = useState({
    nombreComercial: "",
    // Crédito Fiscal
    razonSocial: "",
    nit: "",
    nrc: "",
    giro: "",
    // Consumidor Final
    nombreCompleto: "",
    dui: "",
    // Comunes
    direccion: "",
    contactoNombre: "",
    contactoEmail: "",
    contactoTelefono: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Preparar datos de facturación según el tipo de cliente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let datosFacturacion: any;
      
      if (tipoCliente === "CREDITO_FISCAL") {
        datosFacturacion = {
          razonSocial: formData.razonSocial,
          nit: formData.nit,
          nrc: formData.nrc,
          giro: formData.giro,
          direccion: formData.direccion,
          contacto: {
            nombre: formData.contactoNombre,
            email: formData.contactoEmail,
            telefono: formData.contactoTelefono,
          },
        };
      } else {
        datosFacturacion = {
          nombreCompleto: formData.nombreCompleto,
          dui: formData.dui,
          direccion: formData.direccion,
          contacto: {
            nombre: formData.contactoNombre,
            email: formData.contactoEmail,
            telefono: formData.contactoTelefono,
          },
        };
      }

      const response = await fetch("/api/proyectos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreComercial: formData.nombreComercial,
          tipoCliente,
          datosFacturacion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al crear proyecto");
      }

      // Mostrar mensaje de éxito
      setSuccess(true);
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        router.push("/admin/proyectos");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <main className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <Link href="/admin/proyectos">
            <Button variant="outline" className="mb-4">
              ← Volver a Proyectos
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-deep-navy">Nuevo Proyecto</h1>
          <p className="text-gray-600 mt-2">
            Registra un nuevo cliente retail en el sistema
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Proyecto</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre Comercial */}
              <div className="space-y-2">
                <Label htmlFor="nombreComercial">
                  Nombre Comercial <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nombreComercial"
                  value={formData.nombreComercial}
                  onChange={(e) =>
                    setFormData({ ...formData, nombreComercial: e.target.value })
                  }
                  placeholder="Ej: Muebles XYZ"
                  required
                />
              </div>

              {/* Tipo de Cliente */}
              <div className="space-y-2">
                <Label>
                  Tipo de Cliente <span className="text-red-500">*</span>
                </Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 ${
                      tipoCliente === "CREDITO_FISCAL"
                        ? "border-vibrant-cyan bg-vibrant-cyan/5"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoCliente"
                      value="CREDITO_FISCAL"
                      checked={tipoCliente === "CREDITO_FISCAL"}
                      onChange={() => setTipoCliente("CREDITO_FISCAL")}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium">Crédito Fiscal (Empresa)</p>
                      <p className="text-xs text-gray-500">
                        Empresa con NIT y NRC para crédito fiscal.
                      </p>
                    </div>
                  </label>

                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2 ${
                      tipoCliente === "CONSUMIDOR_FINAL"
                        ? "border-vibrant-cyan bg-vibrant-cyan/5"
                        : "border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipoCliente"
                      value="CONSUMIDOR_FINAL"
                      checked={tipoCliente === "CONSUMIDOR_FINAL"}
                      onChange={() => setTipoCliente("CONSUMIDOR_FINAL")}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-medium">Consumidor Final (Persona Natural)</p>
                      <p className="text-xs text-gray-500">
                        Persona natural con DUI.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Datos de Facturación */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Datos Fiscales (El Salvador)</h3>

                {tipoCliente === "CREDITO_FISCAL" ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="razonSocial">
                        Razón Social <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="razonSocial"
                        value={formData.razonSocial}
                        onChange={(e) =>
                          setFormData({ ...formData, razonSocial: e.target.value })
                        }
                        placeholder="Ej: Muebles XYZ S.A. de C.V."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nit">
                          NIT <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nit"
                          value={formData.nit}
                          onChange={(e) =>
                            setFormData({ ...formData, nit: e.target.value })
                          }
                          placeholder="0000-000000-000-0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="nrc">
                          NRC <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="nrc"
                          value={formData.nrc}
                          onChange={(e) =>
                            setFormData({ ...formData, nrc: e.target.value })
                          }
                          placeholder="000000-0"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="giro">
                        Giro <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="giro"
                        value={formData.giro}
                        onChange={(e) =>
                          setFormData({ ...formData, giro: e.target.value })
                        }
                        placeholder="Ej: Venta de muebles al por menor"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion">
                        Dirección Fiscal <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) =>
                          setFormData({ ...formData, direccion: e.target.value })
                        }
                        placeholder="Dirección fiscal completa"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombreCompleto">
                        Nombre Completo <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="nombreCompleto"
                        value={formData.nombreCompleto}
                        onChange={(e) =>
                          setFormData({ ...formData, nombreCompleto: e.target.value })
                        }
                        placeholder="Nombre completo del propietario"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dui">
                        DUI <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="dui"
                        value={formData.dui}
                        onChange={(e) =>
                          setFormData({ ...formData, dui: e.target.value })
                        }
                        placeholder="00000000-0"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="direccion">
                        Dirección <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="direccion"
                        value={formData.direccion}
                        onChange={(e) =>
                          setFormData({ ...formData, direccion: e.target.value })
                        }
                        placeholder="Dirección completa"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Datos de Contacto */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Contacto Principal</h3>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactoNombre">
                      Nombre Completo <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactoNombre"
                      value={formData.contactoNombre}
                      onChange={(e) =>
                        setFormData({ ...formData, contactoNombre: e.target.value })
                      }
                      placeholder="Nombre del contacto"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactoEmail">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactoEmail"
                      type="email"
                      value={formData.contactoEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, contactoEmail: e.target.value })
                      }
                      placeholder="email@ejemplo.com"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactoTelefono">
                      Teléfono <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="contactoTelefono"
                      type="tel"
                      value={formData.contactoTelefono}
                      onChange={(e) =>
                        setFormData({ ...formData, contactoTelefono: e.target.value })
                      }
                      placeholder="+503 7000-0000"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">¡Proyecto creado exitosamente! Redirigiendo...</span>
                </div>
              )}

              {/* Botones */}
              <div className="flex gap-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-vibrant-cyan hover:bg-vibrant-cyan/90"
                >
                  {loading ? "Creando..." : "Crear Proyecto"}
                </Button>
                <Link href="/admin/proyectos" className="flex-1">
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