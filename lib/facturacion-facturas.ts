import type { BillingDataset } from "@/lib/facturacion-data";

type Direccion = {
  departamento?: string;
  municipio?: string;
  complemento?: string;
};

type EmisorFactura = {
  nit: string;
  nrc: string;
  nombreComercial: string;
  razonSocial: string;
  giro: string;
  direccion: Direccion;
  telefono?: string;
  correo?: string;
};

type ReceptorConsumidorFinal = {
  nombre: string;
  dui: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
};

type ReceptorCreditoFiscal = {
  nit: string;
  nrc: string;
  nombre: string;
  direccion?: string;
  correo?: string;
  telefono?: string;
};

type ItemFactura = {
  numeroItem: number;
  cantidad: number;
  codigo: string;
  descripcion: string;
  unidadMedida: string;
  precioUnitario: number;
  descuento: number;
  ventaNoSujeta: number;
  ventaExenta: number;
  ventaGravada: number;
};

type ResumenFactura = {
  totalNoSujeto: number;
  totalExenta: number;
  totalGravada: number;
  subTotal: number;
  ivaPercibido: number;
  ivaRetenido: number;
  montoTotalOperacion: number;
  totalLetras: string;
  totalDescuentos: number;
};

type InformacionPago = {
  formaPago: string;
  montoPago: number;
  cambio: number;
  referenciaPago: string;
};

type ExtensionFactura = {
  nombreEntrega?: string;
  nombreRecibe?: string;
  observaciones?: string;
};

export type FacturaConsumidorFinal = {
  tipoDocumento: "FACTURA_CONSUMIDOR_FINAL";
  encabezado: {
    codigoGeneracion: string;
    selloRecepcion: string;
    numeroControl: string;
    fechaEmision: string;
    horaEmision: string;
    documentoInterno: string;
    condicionOperacion: string;
    moneda: string;
    municipio: string;
    departamento: string;
  };
  emisor: EmisorFactura;
  receptor: ReceptorConsumidorFinal;
  cuerpoDocumento: ItemFactura[];
  resumen: ResumenFactura;
  informacionPago: InformacionPago;
  extension: ExtensionFactura;
};

export type FacturaCreditoFiscal = {
  tipoDocumento: "FACTURA_CREDITO_FISCAL";
  encabezado: {
    codigoGeneracion: string;
    selloRecepcion: string;
    numeroControl: string;
    fechaEmision: string;
    horaEmision: string;
    documentoInterno: string;
    condicionOperacion: string;
    moneda: string;
    municipio: string;
    departamento: string;
  };
  emisor: EmisorFactura;
  receptor: ReceptorCreditoFiscal;
  cuerpoDocumento: ItemFactura[];
  resumen: ResumenFactura;
  informacionPago: InformacionPago;
  extension: ExtensionFactura;
};

export type FacturaElectronica = FacturaConsumidorFinal | FacturaCreditoFiscal;

const EMISOR_PREDETERMINADO: EmisorFactura = {
  nit: "0000-000000-000-0",
  nrc: "000000-0",
  nombreComercial: "Armados 2Go",
  razonSocial: "Armados 2Go",
  giro: "Servicios de armado e instalación de madera",
  direccion: {
    departamento: "San Salvador",
    municipio: "San Salvador",
    complemento: "",
  },
  telefono: "",
  correo: "",
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function numeroALetrasUSD(monto: number): string {
  const entero = Math.floor(monto);
  const centavos = Math.round((monto - entero) * 100);
  return `${entero.toLocaleString("es-SV", {
    maximumFractionDigits: 0,
  })} ${centavos.toString().padStart(2, "0")}/100 DOLARES`;
}

export function buildFacturaFromDataset(dataset: BillingDataset): FacturaElectronica {
  const totalGravada = round2(dataset.totalsByConcept.totalFacturado);
  const ivaPercibido = round2(totalGravada * 0.13);
  const montoTotalOperacion = round2(totalGravada + ivaPercibido);

  const resumen: ResumenFactura = {
    totalNoSujeto: 0,
    totalExenta: 0,
    totalGravada,
    subTotal: totalGravada,
    ivaPercibido,
    ivaRetenido: 0,
    montoTotalOperacion,
    totalLetras: numeroALetrasUSD(montoTotalOperacion),
    totalDescuentos: 0,
  };

  const now = new Date();
  const fechaEmision = dataset.range.start.toISOString().slice(0, 10);
  const horaEmision = now.toTimeString().slice(0, 8);

  const encabezadoBase = {
    codigoGeneracion: "",
    selloRecepcion: "",
    numeroControl: "",
    fechaEmision,
    horaEmision,
    documentoInterno: "",
    condicionOperacion: "CONTADO",
    moneda: "USD",
    municipio: "San Salvador",
    departamento: "San Salvador",
  };

  const datos = (dataset.proyecto.datosFacturacion ?? {}) as any;

  const cuerpoDocumento: ItemFactura[] = [];
  let itemIndex = 1;

  if (dataset.totalsByConcept.armado !== 0) {
    cuerpoDocumento.push({
      numeroItem: itemIndex++,
      cantidad: 1,
      codigo: "ARM-001",
      descripcion: "Servicios de armado",
      unidadMedida: "Unidad",
      precioUnitario: round2(dataset.totalsByConcept.armado),
      descuento: 0,
      ventaNoSujeta: 0,
      ventaExenta: 0,
      ventaGravada: round2(dataset.totalsByConcept.armado),
    });
  }

  if (dataset.totalsByConcept.tamano !== 0) {
    cuerpoDocumento.push({
      numeroItem: itemIndex++,
      cantidad: 1,
      codigo: "TAM-001",
      descripcion: "Ajustes por tamaño",
      unidadMedida: "Unidad",
      precioUnitario: round2(dataset.totalsByConcept.tamano),
      descuento: 0,
      ventaNoSujeta: 0,
      ventaExenta: 0,
      ventaGravada: round2(dataset.totalsByConcept.tamano),
    });
  }

  if (dataset.totalsByConcept.distancia !== 0) {
    cuerpoDocumento.push({
      numeroItem: itemIndex++,
      cantidad: 1,
      codigo: "DST-001",
      descripcion: "Ajustes por distancia",
      unidadMedida: "Unidad",
      precioUnitario: round2(dataset.totalsByConcept.distancia),
      descuento: 0,
      ventaNoSujeta: 0,
      ventaExenta: 0,
      ventaGravada: round2(dataset.totalsByConcept.distancia),
    });
  }

  if (dataset.totalsByConcept.penalizacion !== 0) {
    cuerpoDocumento.push({
      numeroItem: itemIndex++,
      cantidad: 1,
      codigo: "PEN-001",
      descripcion: "Penalizaciones",
      unidadMedida: "Unidad",
      precioUnitario: round2(dataset.totalsByConcept.penalizacion),
      descuento: 0,
      ventaNoSujeta: 0,
      ventaExenta: 0,
      ventaGravada: round2(dataset.totalsByConcept.penalizacion),
    });
  }

  if (dataset.totalsByConcept.prioridad !== 0) {
    cuerpoDocumento.push({
      numeroItem: itemIndex++,
      cantidad: 1,
      codigo: "PRI-001",
      descripcion: "Ajustes por prioridad",
      unidadMedida: "Unidad",
      precioUnitario: round2(dataset.totalsByConcept.prioridad),
      descuento: 0,
      ventaNoSujeta: 0,
      ventaExenta: 0,
      ventaGravada: round2(dataset.totalsByConcept.prioridad),
    });
  }

  if (cuerpoDocumento.length === 0) {
    cuerpoDocumento.push({
      numeroItem: 1,
      cantidad: 1,
      codigo: "SRV-001",
      descripcion: "Servicios de armado e instalación",
      unidadMedida: "Unidad",
      precioUnitario: totalGravada,
      descuento: 0,
      ventaNoSujeta: 0,
      ventaExenta: 0,
      ventaGravada: totalGravada,
    });
  }

  const informacionPago: InformacionPago = {
    formaPago: "EFECTIVO",
    montoPago: montoTotalOperacion,
    cambio: 0,
    referenciaPago: "",
  };

  const extension: ExtensionFactura = {
    observaciones: "",
  };

  if (dataset.proyecto.tipoCliente === "CONSUMIDOR_FINAL") {
    const receptor: ReceptorConsumidorFinal = {
      nombre: datos.nombreCompleto || "",
      dui: datos.dui || "",
      direccion: datos.direccion || "",
      correo: datos.contacto?.email || "",
      telefono: datos.contacto?.telefono || "",
    };

    const factura: FacturaConsumidorFinal = {
      tipoDocumento: "FACTURA_CONSUMIDOR_FINAL",
      encabezado: encabezadoBase,
      emisor: EMISOR_PREDETERMINADO,
      receptor,
      cuerpoDocumento,
      resumen,
      informacionPago,
      extension,
    };

    return factura;
  }

  const receptorCF: ReceptorCreditoFiscal = {
    nit: datos.nit || "",
    nrc: datos.nrc || "",
    nombre: datos.razonSocial || datos.nombreComercial || "",
    direccion:
      typeof datos.direccion === "string"
        ? datos.direccion
        : datos.direccion?.complemento || "",
    correo: datos.contacto?.email || "",
    telefono: datos.contacto?.telefono || "",
  };

  const facturaCF: FacturaCreditoFiscal = {
    tipoDocumento: "FACTURA_CREDITO_FISCAL",
    encabezado: encabezadoBase,
    emisor: EMISOR_PREDETERMINADO,
    receptor: receptorCF,
    cuerpoDocumento,
    resumen,
    informacionPago,
    extension,
  };

  return facturaCF;
}
