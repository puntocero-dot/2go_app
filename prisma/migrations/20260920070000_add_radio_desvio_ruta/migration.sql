-- Agrega el umbral configurable (en metros) para detectar si un armador se
-- desvió de la ruta sugerida hacia el cliente. Usado por la comparación
-- espacial punto-a-polilínea en /api/ordenes/[id]/ruta, /api/turnos/[id]/ruta
-- y /api/armadores/mapa.

ALTER TABLE "configuracion_geomaps" ADD COLUMN "radioDesvioRuta" INTEGER NOT NULL DEFAULT 150;
