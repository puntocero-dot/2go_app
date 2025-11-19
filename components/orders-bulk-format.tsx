"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

const COLUMNS = [
  {
    key: "codigoReferenciaRetail",
    label: "Código de referencia",
    example: "ORD-2025-001",
    description: "Identificador único de la orden en tu sistema origen.",
    type: "Texto",
  },
  {
    key: "proyecto",
    label: "Proyecto",
    example: "Punto Cero",
    description:
      "Nombre comercial del proyecto registrado en 2GO. Debe coincidir exactamente.",
    type: "Texto",
  },
  {
    key: "clienteNombre",
    label: "Nombre del cliente",
    example: "Juan Pérez",
    description: "Nombre del cliente final.",
    type: "Texto",
  },
  {
    key: "clienteTelefono",
    label: "Teléfono",
    example: "75867852",
    description: "Número de contacto del cliente final.",
    type: "Texto",
  },
  {
    key: "clienteEmail",
    label: "Email",
    example: "juan@example.com",
    description: "Correo del cliente (opcional).",
    type: "Texto",
  },
  {
    key: "clienteDireccion",
    label: "Dirección",
    example: "Col. San Patricio, Calle Ppal. #12",
    description: "Dirección donde se realizará el armado.",
    type: "Texto",
  },
  {
    key: "clienteMunicipio",
    label: "Municipio",
    example: "San Salvador",
    description: "Municipio del cliente.",
    type: "Texto",
  },
  {
    key: "clienteDepartamento",
    label: "Departamento",
    example: "San Salvador",
    description: "Departamento del cliente.",
    type: "Texto",
  },
  {
    key: "muebleTamano",
    label: "Categoría del mueble",
    example: "GRANDE",
    description: "Valores válidos: GRANDE, MEDIANO, PEQUENO.",
    type: "Texto",
  },
  {
    key: "muebleNombre",
    label: "Modelo del mueble",
    example: "Ropero 6 puertas",
    description: "Nombre o descripción breve del mueble.",
    type: "Texto",
  },
  {
    key: "muebleSKU",
    label: "SKU",
    example: "SKU-123456",
    description: "Identificador interno del mueble (opcional).",
    type: "Texto",
  },
  {
    key: "notasEntrega",
    label: "Notas para el armador",
    example: "Llamar 30 minutos antes",
    description: "Instrucciones especiales u observaciones (opcional).",
    type: "Texto",
  },
  {
    key: "fechaSolicitada",
    label: "Fecha solicitada",
    example: "2025-03-15",
    description:
      "Fecha preferida por el cliente en formato AAAA-MM-DD (opcional, se puede dejar vacía y definirla después).",
    type: "Fecha",
  },
];

export function OrdersBulkFormat() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Formato para carga masiva de órdenes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          Descarga este formato y completa una fila por orden. Usa UTF-8 o Excel. Los
          encabezados deben mantenerse exactamente como se muestran. Con esta información se
          podrán crear órdenes, clientes y muebles automáticamente cuando corresponda.
        </p>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Llave</TableHead>
                <TableHead>Etiqueta</TableHead>
                <TableHead>Ejemplo</TableHead>
                <TableHead>Explicación</TableHead>
                <TableHead>Tipo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COLUMNS.map((column) => (
                <TableRow key={column.key}>
                  <TableCell className="font-mono text-xs">{column.key}</TableCell>
                  <TableCell>{column.label}</TableCell>
                  <TableCell>{column.example}</TableCell>
                  <TableCell>{column.description}</TableCell>
                  <TableCell>{column.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            * Campos marcados como opcionales pueden dejarse vacíos. Si el proyecto, cliente
            o mueble ya existe, se intentará buscar coincidencias por nombre/SKU antes de crear
            registros nuevos.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const headers = COLUMNS.map((c) => c.key).join(",");
              const example = COLUMNS.map((c) => c.example ?? "").join(",");
              const csv = `${headers}\n${example}\n`;

              const blob = new Blob([csv], {
                type: "text/csv;charset=utf-8;",
              });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "formato-ordenes.csv";
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            }}
            className="mt-1 self-start"
          >
            Descargar formato CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}