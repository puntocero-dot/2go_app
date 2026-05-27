-- CreateEnum
CREATE TYPE "TamanoMueble" AS ENUM ('GRANDE', 'MEDIANO', 'PEQUENO');

-- CreateEnum
CREATE TYPE "PrioridadUsuario" AS ENUM ('VIP', 'URGENTE', 'MEDIA', 'NORMAL');

-- CreateEnum
CREATE TYPE "EstadoArmador" AS ENUM ('ACTIVO', 'INACTIVO', 'VACACIONES');

-- CreateEnum
CREATE TYPE "TipoCliente" AS ENUM ('CREDITO_FISCAL', 'CONSUMIDOR_FINAL');

-- CreateEnum
CREATE TYPE "EstadoOrden" AS ENUM ('SIN_ASIGNAR', 'ASIGNADO', 'EN_RUTA', 'ARMADO_INICIADO', 'ARMADO_FINALIZADO', 'ARMADO_COMPLETADO');

-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SUPERVISOR', 'ARMADOR');

-- CreateEnum
CREATE TYPE "TipoArchivo" AS ENUM ('FOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "TipoPenalizacion" AS ENUM ('CLIENTE_NO_CONTESTO', 'PEDIDO_CANCELADO_EN_RUTA');

-- CreateEnum
CREATE TYPE "TipoReglaPrincipal" AS ENUM ('COBRO_FIJO_UNITARIO', 'COBRO_POR_VOLUMEN');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "rol" "RolUsuario" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "armadores" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "estado" "EstadoArmador" NOT NULL DEFAULT 'ACTIVO',
    "fechaContratacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "preferenciasHorarias" JSONB,
    "habilidades" TEXT[],
    "ubicacionActualLat" DOUBLE PRECISION,
    "ubicacionActualLng" DOUBLE PRECISION,
    "ultimaActualizacionGPS" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "armadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proyectos" (
    "id" TEXT NOT NULL,
    "nombreComercial" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "tipoCliente" "TipoCliente" NOT NULL,
    "datosFacturacion" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supervisor_proyectos" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supervisor_proyectos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_cobro" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tipoPrincipal" "TipoReglaPrincipal" NOT NULL,
    "precioFijoUnitario" DOUBLE PRECISION,
    "precioVIP" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioUrgente" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioMedia" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioNormal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioGrande" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioMediano" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "precioPequeno" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_cobro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rangos_volumen" (
    "id" TEXT NOT NULL,
    "reglaCobroId" TEXT NOT NULL,
    "desde" INTEGER NOT NULL,
    "hasta" INTEGER,
    "precio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rangos_volumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobros_distancia" (
    "id" TEXT NOT NULL,
    "reglaCobroId" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cobros_distancia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalizaciones" (
    "id" TEXT NOT NULL,
    "reglaCobroId" TEXT NOT NULL,
    "tipo" "TipoPenalizacion" NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "penalizaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muebles" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tamano" "TamanoMueble" NOT NULL,
    "descripcion" TEXT,
    "proyectoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "muebles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios_finales" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "email" TEXT,
    "direccionCompleta" TEXT NOT NULL,
    "municipio" TEXT NOT NULL,
    "departamento" TEXT NOT NULL,
    "coordenadasLat" DOUBLE PRECISION,
    "coordenadasLng" DOUBLE PRECISION,
    "prioridad" "PrioridadUsuario" NOT NULL DEFAULT 'NORMAL',
    "proyectoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_finales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL,
    "codigoReferenciaRetail" TEXT NOT NULL,
    "muebleId" TEXT NOT NULL,
    "usuarioFinalId" TEXT NOT NULL,
    "armadorId" TEXT,
    "proyectoId" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaSolicitadaCliente" TIMESTAMP(3),
    "fechaAsignacion" TIMESTAMP(3),
    "fechaRuta" TIMESTAMP(3),
    "fechaInicioArmado" TIMESTAMP(3),
    "fechaFinArmado" TIMESTAMP(3),
    "fechaCompletado" TIMESTAMP(3),
    "estado" "EstadoOrden" NOT NULL DEFAULT 'SIN_ASIGNAR',
    "tiempoAcumuladoEstados" JSONB,
    "cobroFinal" DOUBLE PRECISION,
    "desgloseCobro" JSONB,
    "linkMagicoToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_estado" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "estadoAnterior" "EstadoOrden",
    "estadoNuevo" "EstadoOrden",
    "estadoCambiadoA" "EstadoOrden" NOT NULL,
    "comentario" TEXT,
    "usuarioId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "etaEstimado" TIMESTAMP(3),

    CONSTRAINT "registros_estado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "archivos_ordenes" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tipo" "TipoArchivo" NOT NULL,
    "fechaSubida" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEliminacionProgramada" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "archivos_ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "penalizaciones_aplicadas" (
    "id" TEXT NOT NULL,
    "ordenId" TEXT NOT NULL,
    "tipo" "TipoPenalizacion" NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "fechaIncidente" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "penalizaciones_aplicadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_sistema" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" JSONB NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_actividad" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "detalles" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_actividad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE INDEX "usuarios_email_idx" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "armadores_usuarioId_key" ON "armadores"("usuarioId");

-- CreateIndex
CREATE INDEX "armadores_estado_idx" ON "armadores"("estado");

-- CreateIndex
CREATE INDEX "proyectos_activo_idx" ON "proyectos"("activo");

-- CreateIndex
CREATE INDEX "supervisor_proyectos_proyectoId_idx" ON "supervisor_proyectos"("proyectoId");

-- CreateIndex
CREATE UNIQUE INDEX "supervisor_proyectos_usuarioId_proyectoId_key" ON "supervisor_proyectos"("usuarioId", "proyectoId");

-- CreateIndex
CREATE UNIQUE INDEX "reglas_cobro_proyectoId_key" ON "reglas_cobro"("proyectoId");

-- CreateIndex
CREATE INDEX "rangos_volumen_reglaCobroId_idx" ON "rangos_volumen"("reglaCobroId");

-- CreateIndex
CREATE INDEX "cobros_distancia_reglaCobroId_idx" ON "cobros_distancia"("reglaCobroId");

-- CreateIndex
CREATE UNIQUE INDEX "cobros_distancia_reglaCobroId_municipio_key" ON "cobros_distancia"("reglaCobroId", "municipio");

-- CreateIndex
CREATE INDEX "penalizaciones_reglaCobroId_idx" ON "penalizaciones"("reglaCobroId");

-- CreateIndex
CREATE UNIQUE INDEX "penalizaciones_reglaCobroId_tipo_key" ON "penalizaciones"("reglaCobroId", "tipo");

-- CreateIndex
CREATE INDEX "muebles_proyectoId_idx" ON "muebles"("proyectoId");

-- CreateIndex
CREATE INDEX "usuarios_finales_proyectoId_idx" ON "usuarios_finales"("proyectoId");

-- CreateIndex
CREATE INDEX "usuarios_finales_municipio_idx" ON "usuarios_finales"("municipio");

-- CreateIndex
CREATE UNIQUE INDEX "ordenes_linkMagicoToken_key" ON "ordenes"("linkMagicoToken");

-- CreateIndex
CREATE INDEX "ordenes_estado_idx" ON "ordenes"("estado");

-- CreateIndex
CREATE INDEX "ordenes_proyectoId_idx" ON "ordenes"("proyectoId");

-- CreateIndex
CREATE INDEX "ordenes_armadorId_idx" ON "ordenes"("armadorId");

-- CreateIndex
CREATE INDEX "ordenes_linkMagicoToken_idx" ON "ordenes"("linkMagicoToken");

-- CreateIndex
CREATE INDEX "registros_estado_ordenId_idx" ON "registros_estado"("ordenId");

-- CreateIndex
CREATE INDEX "registros_estado_timestamp_idx" ON "registros_estado"("timestamp");

-- CreateIndex
CREATE INDEX "archivos_ordenes_ordenId_idx" ON "archivos_ordenes"("ordenId");

-- CreateIndex
CREATE INDEX "archivos_ordenes_fechaEliminacionProgramada_idx" ON "archivos_ordenes"("fechaEliminacionProgramada");

-- CreateIndex
CREATE INDEX "penalizaciones_aplicadas_ordenId_idx" ON "penalizaciones_aplicadas"("ordenId");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_sistema_clave_key" ON "configuracion_sistema"("clave");

-- CreateIndex
CREATE INDEX "logs_actividad_usuarioId_idx" ON "logs_actividad"("usuarioId");

-- CreateIndex
CREATE INDEX "logs_actividad_timestamp_idx" ON "logs_actividad"("timestamp");

-- AddForeignKey
ALTER TABLE "armadores" ADD CONSTRAINT "armadores_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_proyectos" ADD CONSTRAINT "supervisor_proyectos_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supervisor_proyectos" ADD CONSTRAINT "supervisor_proyectos_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_cobro" ADD CONSTRAINT "reglas_cobro_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rangos_volumen" ADD CONSTRAINT "rangos_volumen_reglaCobroId_fkey" FOREIGN KEY ("reglaCobroId") REFERENCES "reglas_cobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobros_distancia" ADD CONSTRAINT "cobros_distancia_reglaCobroId_fkey" FOREIGN KEY ("reglaCobroId") REFERENCES "reglas_cobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalizaciones" ADD CONSTRAINT "penalizaciones_reglaCobroId_fkey" FOREIGN KEY ("reglaCobroId") REFERENCES "reglas_cobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "muebles" ADD CONSTRAINT "muebles_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuarios_finales" ADD CONSTRAINT "usuarios_finales_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_muebleId_fkey" FOREIGN KEY ("muebleId") REFERENCES "muebles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_usuarioFinalId_fkey" FOREIGN KEY ("usuarioFinalId") REFERENCES "usuarios_finales"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_armadorId_fkey" FOREIGN KEY ("armadorId") REFERENCES "armadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "proyectos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_estado" ADD CONSTRAINT "registros_estado_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_estado" ADD CONSTRAINT "registros_estado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "archivos_ordenes" ADD CONSTRAINT "archivos_ordenes_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "penalizaciones_aplicadas" ADD CONSTRAINT "penalizaciones_aplicadas_ordenId_fkey" FOREIGN KEY ("ordenId") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
