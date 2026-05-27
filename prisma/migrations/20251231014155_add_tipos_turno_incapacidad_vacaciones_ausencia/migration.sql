-- CreateEnum
CREATE TYPE "TipoTurno" AS ENUM ('NORMAL', 'EXTRA', 'MEDIO_TIEMPO', 'DESCANSO', 'INCAPACIDAD', 'VACACIONES', 'AUSENCIA');

-- CreateEnum
CREATE TYPE "EstadoLoggeo" AS ENUM ('ACTIVO', 'LUNCH', 'BREAK', 'OFFLINE');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('ACTIVO', 'PAUSADO', 'FINALIZADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "TipoPunto" AS ENUM ('INICIO', 'INTERMEDIO', 'PARADA', 'FIN');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "estadoLoggeo" "EstadoLoggeo" NOT NULL DEFAULT 'OFFLINE';

-- CreateTable
CREATE TABLE "horarios_programados" (
    "id" TEXT NOT NULL,
    "armadorId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT NOT NULL,
    "tipoTurno" "TipoTurno" NOT NULL DEFAULT 'NORMAL',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_programados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones_usuario" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "datos" JSONB,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_facturacion" (
    "id" TEXT NOT NULL,
    "nombreEmpresa" TEXT NOT NULL DEFAULT 'Armados 2Go',
    "giro" TEXT NOT NULL DEFAULT 'Servicios de armado de muebles',
    "direccion" TEXT NOT NULL DEFAULT 'San Salvador, El Salvador',
    "telefono" TEXT NOT NULL DEFAULT '+503 0000-0000',
    "email" TEXT NOT NULL DEFAULT 'facturacion@armados2go.com',
    "logoUrl" TEXT,
    "colorPrimario" TEXT NOT NULL DEFAULT '#2E4F4F',
    "colorAccent" TEXT NOT NULL DEFAULT '#ED7D32',
    "terminosCondiciones" TEXT,
    "notasPiePagina" TEXT NOT NULL DEFAULT 'Esta factura es un documento oficial generado por el sistema Armados 2Go.',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_facturacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "armadorId" TEXT NOT NULL,
    "inicioTurno" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finTurno" TIMESTAMP(3),
    "estado" "EstadoTurno" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ruta_puntos" (
    "id" TEXT NOT NULL,
    "turnoId" TEXT NOT NULL,
    "latitud" DOUBLE PRECISION NOT NULL,
    "longitud" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoPunto" NOT NULL DEFAULT 'INTERMEDIO',
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ruta_puntos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion_geomaps" (
    "id" TEXT NOT NULL,
    "duracionMinimaParada" INTEGER NOT NULL DEFAULT 5,
    "radioParada" INTEGER NOT NULL DEFAULT 50,
    "umbralVelocidadExcesiva" INTEGER NOT NULL DEFAULT 80,
    "radioProximidadCliente" INTEGER NOT NULL DEFAULT 100,
    "intervaloActualizacionGPS" INTEGER NOT NULL DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_geomaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horarios_programados_fecha_idx" ON "horarios_programados"("fecha");

-- CreateIndex
CREATE INDEX "horarios_programados_armadorId_idx" ON "horarios_programados"("armadorId");

-- CreateIndex
CREATE UNIQUE INDEX "horarios_programados_armadorId_fecha_key" ON "horarios_programados"("armadorId", "fecha");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_usuarioId_leida_idx" ON "notificaciones_usuario"("usuarioId", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_usuario_createdAt_idx" ON "notificaciones_usuario"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "turnos_armadorId_idx" ON "turnos"("armadorId");

-- CreateIndex
CREATE INDEX "turnos_estado_idx" ON "turnos"("estado");

-- CreateIndex
CREATE INDEX "turnos_inicioTurno_idx" ON "turnos"("inicioTurno");

-- CreateIndex
CREATE INDEX "ruta_puntos_turnoId_idx" ON "ruta_puntos"("turnoId");

-- CreateIndex
CREATE INDEX "ruta_puntos_timestamp_idx" ON "ruta_puntos"("timestamp");

-- AddForeignKey
ALTER TABLE "horarios_programados" ADD CONSTRAINT "horarios_programados_armadorId_fkey" FOREIGN KEY ("armadorId") REFERENCES "armadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones_usuario" ADD CONSTRAINT "notificaciones_usuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_armadorId_fkey" FOREIGN KEY ("armadorId") REFERENCES "armadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ruta_puntos" ADD CONSTRAINT "ruta_puntos_turnoId_fkey" FOREIGN KEY ("turnoId") REFERENCES "turnos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
