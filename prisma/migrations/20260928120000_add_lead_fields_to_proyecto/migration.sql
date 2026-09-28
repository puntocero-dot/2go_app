-- Captura de leads de 2GoBot: un lead entra como Proyecto con esLead=true
-- (y activo=false) en vez de una tabla nueva. Se excluye de los listados
-- y KPIs de clientes reales (esLead=false) hasta que un admin lo revisa
-- y lo convierte desde /admin/leads.

-- CreateEnum
CREATE TYPE "EstadoLead" AS ENUM ('NUEVO', 'CONTACTADO', 'CALIFICADO', 'CONVERTIDO', 'DESCARTADO');

-- AlterTable
ALTER TABLE "proyectos" ADD COLUMN     "esLead" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "estadoLead" "EstadoLead",
ADD COLUMN     "notasLead" TEXT,
ADD COLUMN     "contactoLead" JSONB,
ADD COLUMN     "citaProgramadaEn" TIMESTAMP(3),
ADD COLUMN     "googleCalendarEventId" TEXT;

-- CreateIndex
CREATE INDEX "proyectos_esLead_idx" ON "proyectos"("esLead");
