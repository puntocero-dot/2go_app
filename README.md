# 🛠️ Armados 2Go

Sistema integral de gestión de armado de muebles para empresas retail.

## 🚀 Instalación

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

#### POST /api/ordenes/[id]/asignacion-automatica

Respuesta:

```json
{
  "ordenId": "string",
  "sugerencia": {
    "armadorId": "string",
    "nombre": "string",
    "telefono": "string|null",
    "score": number,
    "etaEstimadoMin": number
  },
  "alternativas": [
    {
      "armadorId": "string",
      "nombre": "string",
      "score": number,
      "etaEstimadoMin": number
    }
  ],
  "heuristica": "string"
}