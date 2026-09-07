# Aviso de Privacidad — Armados 2Go

> ⚠️ **PLANTILLA — requiere revisión de abogado antes de publicarse.** Ver [README.md](README.md).

**Última actualización:** [FECHA]

Punto Cero S.A.S. de C.V. ("Punto Cero", "nosotros"), con domicilio en
[DIRECCIÓN COMPLETA], San Salvador, El Salvador, es responsable del tratamiento de los
datos personales que se recaban a través de la plataforma Armados 2Go (el "Servicio"),
conforme a la Ley de Protección de Datos Personales de El Salvador y demás normativa
aplicable.

Este Aviso de Privacidad describe qué datos personales recolectamos, con qué finalidad,
con quién los compartimos, y cómo puede ejercer sus derechos.

---

## 1. ¿A quién aplica este Aviso?

Este Aviso aplica a toda persona cuyos datos personales sean tratados a través del
Servicio, incluyendo:

- **Administradores y Supervisores** de empresas Cliente.
- **Armadores** (personal de campo que presta el servicio de armado).
- **Clientes Finales** (consumidores que reciben el servicio de armado de muebles).

## 2. Datos personales que recolectamos

| Categoría de dato | Ejemplos | De quién | Finalidad |
|---|---|---|---|
| Datos de identificación y contacto | Nombre, correo electrónico, teléfono, dirección | Todos los tipos de usuario | Crear y gestionar cuentas, comunicación operativa |
| Credenciales de acceso | Contraseña (almacenada cifrada), sesión | Administradores, Supervisores, Armadores | Autenticación y seguridad |
| Datos de ubicación (GPS) | Coordenadas geográficas en tiempo real durante turnos activos | Armadores | Asignación de órdenes, cálculo de tiempo estimado de llegada, generación de rutas |
| Evidencia del servicio | Fotografías, video | Armadores (quien las sube), pudiendo incluir imágenes relacionadas con el domicilio del Cliente Final | Verificación de la calidad y finalización del trabajo |
| Datos de la orden de trabajo | Dirección de entrega, municipio, departamento, notas de la orden | Clientes Finales | Prestación del servicio de armado |
| Datos de uso técnico | Dirección IP, tipo de dispositivo, registros de acceso (logs) | Todos los tipos de usuario | Seguridad, prevención de fraude, diagnóstico técnico |
| Suscripción a notificaciones push | Token de dispositivo (endpoint de notificación) | Usuarios que habilitan notificaciones | Envío de alertas operativas |

**No recolectamos** datos sensibles según la definición legal (salud, religión,
orientación sexual, afiliación política/sindical, datos biométricos), salvo que se
identifique lo contrario tras revisión del código y funcionalidades futuras.

> ⚠️ Verificar si el campo de "habilidades" del Armador o cualquier otro campo libre
> pudiera capturar accidentalmente datos sensibles (ej. condición médica que limite
> ciertas tareas) — si es así, deben tratarse con reglas más estrictas.

## 3. Finalidades del tratamiento

Tratamos los datos personales para las siguientes finalidades:

**Finalidades necesarias para la prestación del Servicio** (no requieren consentimiento
adicional, son necesarias para el vínculo contractual):

- Gestionar el registro y autenticación de cuentas.
- Asignar y dar seguimiento a órdenes de trabajo.
- Calcular tiempos estimados de llegada y optimizar rutas.
- Generar comprobantes, reportes y facturación para el Cliente.
- Enviar notificaciones operativas (confirmaciones, cambios de estado).
- Brindar soporte técnico.
- Prevenir fraude y garantizar la seguridad de la Plataforma.

**Finalidades secundarias** (requieren consentimiento, pueden ser rechazadas sin afectar
el Servicio):

- [Ej. Envío de comunicaciones promocionales sobre nuevas funcionalidades — **definir si
  aplica**]
- [Ej. Análisis estadístico agregado para mejora del producto — definir]

## 4. Con quién compartimos los datos

Compartimos datos personales con los siguientes terceros, únicamente en la medida
necesaria para la prestación del Servicio:

| Proveedor | Rol | Datos que procesa | Ubicación (aprox.) |
|---|---|---|---|
| **Vercel Inc.** | Hosting e infraestructura de la aplicación | Todos los datos que transitan por la Plataforma | Estados Unidos |
| **Supabase (Supabase Inc. / infraestructura sobre AWS)** | Base de datos | Todos los datos personales almacenados | Estados Unidos (según región configurada) |
| **Cloudinary Inc.** | Almacenamiento y procesamiento de imágenes/video | Evidencia fotográfica y de video subida por Armadores | Estados Unidos |
| **Mapbox Inc.** | Servicios de mapas y geolocalización | Coordenadas GPS, direcciones para cálculo de rutas | Estados Unidos |
| **Resend** | Envío de correos electrónicos transaccionales | Nombre, correo electrónico, contenido de la notificación | Estados Unidos |
| **Upstash Inc.** | Cache y control de límites de uso (rate limiting) | Identificadores técnicos (IP, claves de sesión) — no almacena datos personales de forma persistente | Estados Unidos |

**Con el Cliente contratante:** los datos de Clientes Finales y de Armadores son
visibles para el Cliente (empresa retail) que contrató el Servicio, en su calidad de
responsable/encargado según se defina en el [Contrato de Encargo de Tratamiento de
Datos](04-contrato-encargo-tratamiento-datos.md).

**No vendemos** datos personales a terceros para fines de mercadeo.

> ⚠️ El abogado debe confirmar la naturaleza de la transferencia internacional de datos
> (todos los proveedores listados operan principalmente desde EE.UU.) y si se requiere
> alguna cláusula contractual tipo o mecanismo de transferencia conforme a la LPDP
> salvadoreña.

## 5. Transferencias internacionales de datos

Dado que los proveedores mencionados en la sección anterior operan principalmente desde
servidores ubicados fuera de El Salvador (mayoritariamente Estados Unidos), sus datos
personales podrán ser transferidos y procesados en dichos países. Punto Cero exige
contractualmente a estos proveedores (mediante sus propios términos de servicio y, donde
aplique, acuerdos de procesamiento de datos) la implementación de medidas de seguridad
adecuadas.

## 6. Plazo de conservación

Conservamos los datos personales durante la vigencia de la relación con el Cliente y por
un período adicional de [DEFINIR — ej. 5 años] posterior a la terminación del contrato,
para atender obligaciones legales, fiscales o para la defensa ante reclamos, transcurrido
el cual serán eliminados o anonimizados.

Los datos de ubicación GPS histórica se conservan por [DEFINIR — ej. 12 meses] para
fines de auditoría de rutas y resolución de disputas.

> ⚠️ Verificar plazos reales de retención en el código (`prisma/schema.prisma`,
> cron jobs de limpieza si existen) — si no hay política de retención implementada,
> debe crearse antes de publicar un plazo específico en este documento.

## 7. Derechos ARCO y cómo ejercerlos

Conforme a la Ley de Protección de Datos Personales de El Salvador, usted tiene derecho
a:

- **Acceder** a sus datos personales en nuestro poder.
- **Rectificar** datos inexactos o incompletos.
- **Cancelar** (eliminar) sus datos cuando ya no sean necesarios para las finalidades
  que motivaron su tratamiento.
- **Oponerse** al tratamiento para finalidades específicas.
- **Revocar** su consentimiento en cualquier momento, cuando el tratamiento se base en
  consentimiento.

Para ejercer estos derechos, puede escribir a [EMAIL DE CONTACTO — ej.
admin@armados2go.com], indicando su nombre completo,
descripción clara de la solicitud, y adjuntando un medio de identificación. Responderemos
dentro del plazo legal aplicable.

## 8. Seguridad de los datos

Implementamos medidas técnicas y organizativas razonables para proteger los datos
personales, incluyendo: cifrado de contraseñas, conexiones cifradas (HTTPS), control de
acceso basado en roles, límites de tasa de peticiones (rate limiting) y registro de
auditoría de acciones administrativas.

Ningún sistema es 100% seguro; en caso de una brecha de seguridad que afecte datos
personales, notificaremos conforme a lo exigido por la ley aplicable.

## 9. Menores de edad

El Servicio no está dirigido a menores de 18 años y no recolectamos conscientemente
datos de menores, salvo en la medida en que un adulto responsable ingrese datos de un
Cliente Final que pudiera ser menor (ej. dirección de entrega a nombre de una familia).

## 10. Cambios a este Aviso

Podemos actualizar este Aviso de Privacidad periódicamente. Los cambios sustanciales
serán notificados a través del Servicio o por correo electrónico.

## 11. Contacto

Para cualquier consulta relacionada con este Aviso de Privacidad:

**Punto Cero S.A.S. de C.V.**
[DIRECCIÓN COMPLETA]
Correo: [EMAIL DE CONTACTO LEGAL/PRIVACIDAD]

---

## Notas para el abogado revisor

- La Ley de Protección de Datos Personales de El Salvador es reciente (2025) — validar
  requisitos específicos de forma (ej. si se requiere registro ante una autoridad de
  protección de datos, plazos exactos de respuesta a solicitudes ARCO).
- Definir si las finalidades secundarias (sección 3) existen realmente en el negocio; si
  no, eliminar esa sección para no generar expectativas de opt-out que no existen.
- Confirmar si se requiere un mecanismo de consentimiento explícito y registrado (ej.
  checkbox con timestamp) para el tratamiento de ubicación GPS de los Armadores —
  recomendable implementarlo en el código, no solo declararlo en el documento.
- Revisar si aplica la designación de un Oficial de Protección de Datos (DPO) según el
  volumen de datos tratado.
- Publicar este documento en una ruta pública de la app (ej. `/legal/privacidad`) y
  enlazarlo desde el formulario de registro/login.
