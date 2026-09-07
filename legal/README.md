# Documentos legales — Armados 2Go

## ⚠️ Antes de usar cualquiera de estos documentos

Estas son **plantillas base**, no asesoría legal. Fueron generadas por IA a partir de
las cláusulas estándar de la industria SaaS y de lo que el código de esta app
efectivamente hace (qué datos recolecta, con qué proveedores, para quién).

**Un abogado colegiado en El Salvador debe revisar y adaptar cada documento antes de:**
- Publicarlo en el sitio o la app
- Anexarlo a un contrato con un cliente (ej. UNICOMER u otro retail)
- Usarlo como base para resolver una disputa

Un documento legal mal calibrado es peor que no tenerlo: crea una falsa sensación de
cobertura y puede generar obligaciones que no querías asumir.

## Datos usados para generar estos documentos

| Campo | Valor usado | Fuente | Estado |
|---|---|---|---|
| Razón social | Punto Cero S.A.S. de C.V. | `prd-data.sql` (seed de proyecto "Punto Cero") | ⚠️ Verificar si es el dato oficial o de prueba |
| NIT | 0614-180689-111-2 | `prd-data.sql` | ⚠️ **Parece dato de desarrollo/seed — CONFIRMAR con documento de constitución real** |
| NRC | 234567 | `prd-data.sql` | ⚠️ Igual que arriba, confirmar |
| Giro | Servicios informáticos | `prd-data.sql` | Verificar redacción exacta que uses en DGII |
| Domicilio | San Salvador, El Salvador | `prd-data.sql` | Falta dirección completa (calle, colonia, nº) |
| Contacto legal/representante | admin@armados2go.com (decisión del negocio: no exponer nombre/correo personal en documentos públicos ni internos) | `prd-data.sql` tenía originalmente un contacto personal — reemplazado por solicitud expresa | Definir representante legal formal con el abogado |
| Producto | Armados 2Go (`www.armados2go.com`) | Código del proyecto | — |
| Modelo de negocio | SaaS B2B2C: el cliente contratante es una empresa retail; los usuarios finales del servicio de armado son consumidores de esa empresa; el personal de campo son "armadores" contratados/subcontratados por Punto Cero o el cliente (**definir cuál**) | Inferido del código (`schema.prisma`, `app/`) | ⚠️ Definir con el negocio la relación laboral/mercantil real con los armadores — cambia el DPA y el T&C |
| Subprocesadores (proveedores que tocan datos) | Vercel (hosting/infraestructura), Supabase (base de datos), Cloudinary (almacenamiento de fotos/video), Mapbox (geolocalización), Resend (email transaccional), Upstash (Redis, cache/rate limiting) | `.env.example`, código | Confirmar ubicación de cada proveedor (mayoría en EE.UU.) para la cláusula de transferencia internacional |
| Datos personales procesados | Nombre, email, teléfono, dirección, ubicación GPS en tiempo real (armadores), fotos/video de evidencia de trabajo, datos de clientes finales del proyecto (terceros respecto al cliente contratante) | `prisma/schema.prisma`, `components/armador-gps-tracker.tsx`, `lib/upload` | — |
| Menores de edad | No hay verificación de edad en el registro | Código (`app/login`, `app/api/auth`) | Definir política — normalmente T&C dice "servicio no dirigido a menores de 18" |

## Documentos incluidos

1. [01-contrato-licencia-saas.md](01-contrato-licencia-saas.md) — Contrato de Licencia de Uso / SaaS (Punto Cero ↔ Cliente retail)
2. [02-terminos-condiciones-usuario-final.md](02-terminos-condiciones-usuario-final.md) — Términos y Condiciones (usuarios de la plataforma: admins, supervisores, armadores, clientes finales)
3. [03-aviso-privacidad.md](03-aviso-privacidad.md) — Aviso de Privacidad
4. [04-contrato-encargo-tratamiento-datos.md](04-contrato-encargo-tratamiento-datos.md) — DPA (Data Processing Agreement)
5. [05-contrato-desarrollo-medida-cesion-derechos.md](05-contrato-desarrollo-medida-cesion-derechos.md) — Desarrollo a la medida + cesión de derechos de autor

## Marco legal salvadoreño a considerar (que el abogado debe confirmar)

- **Ley de Protección de Datos Personales de El Salvador** (LPDP, vigente desde 2025) — aplica al Aviso de Privacidad y al DPA.
- **Código de Comercio** — para la naturaleza mercantil de los contratos B2B.
- **Ley de Firma Electrónica** — si planeas firmar estos documentos digitalmente.
- Si tienes clientes o armadores fuera de El Salvador, revisar si aplica también GDPR (UE) o alguna ley de datos del país del usuario final.

## Próximos pasos sugeridos

1. Llenar los placeholders `[ASÍ]` en cada documento con datos confirmados.
2. Enviar los 5 documentos a un abogado salvadoreño especializado en tecnología/protección de datos.
3. Definir formalmente la relación con los "armadores" (empleados, contratistas independientes, subcontratistas) — esto cambia sustancialmente el DPA y los T&C.
4. Publicar versión final del Aviso de Privacidad y T&C en rutas públicas de la app (ej. `/legal/privacidad`, `/legal/terminos`) y enlazarlas desde el registro/login.
5. Repetir este proceso para los demás proyectos (Conta_2go, Drive2go, etc.) cuando se defina su alcance.
