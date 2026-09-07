# Contrato de Encargo de Tratamiento de Datos (DPA)
### Anexo al Contrato de Licencia SaaS — Armados 2Go

> ⚠️ **PLANTILLA — requiere revisión de abogado antes de usarse.** Ver [README.md](README.md).

**Fecha:** [FECHA DE FIRMA]

Este Contrato de Encargo de Tratamiento de Datos ("DPA", por sus siglas en inglés) se
celebra entre:

**EL RESPONSABLE:** [RAZÓN SOCIAL DEL CLIENTE], en adelante "EL RESPONSABLE" — la
empresa que contrata el Servicio y determina las finalidades y medios del tratamiento
de los datos personales de sus Clientes Finales y, en su caso, de sus Armadores.

**EL ENCARGADO:** Punto Cero S.A.S. de C.V., en adelante "EL ENCARGADO" — el proveedor
de la Plataforma Armados 2Go, que trata los datos personales por cuenta y bajo
instrucciones de EL RESPONSABLE.

Este DPA forma parte integral del [Contrato de Licencia de Uso SaaS](01-contrato-licencia-saas.md)
suscrito entre las Partes (el "Contrato Principal") y tiene por objeto regular el
tratamiento de datos personales de terceros (Clientes Finales y, cuando corresponda,
Armadores) que EL ENCARGADO realiza por cuenta de EL RESPONSABLE.

---

## 1. Objeto y alcance

EL RESPONSABLE utiliza la Plataforma Armados 2Go para gestionar órdenes de servicio de
armado de muebles dirigidas a sus propios clientes ("Clientes Finales"). En el curso de
esta prestación, EL ENCARGADO trata datos personales de dichos Clientes Finales (y, en
su caso, de personal de campo) por cuenta de EL RESPONSABLE.

Este DPA aplica únicamente a los datos personales de **terceros respecto de EL
RESPONSABLE** (Clientes Finales, y Armadores si estos no son empleados directos de EL
ENCARGADO). No aplica a los datos personales de los propios empleados de EL RESPONSABLE
que usan la Plataforma como administradores/supervisores, cuyo tratamiento se rige por
el [Aviso de Privacidad](03-aviso-privacidad.md) general.

> ⚠️ **Definición crítica a resolver antes de firmar:** si los Armadores son contratados
> directamente por Punto Cero (EL ENCARGADO), sus datos NO entran en este DPA — se rigen
> por la relación laboral/mercantil directa. Si los Armadores son personal de EL
> RESPONSABLE o subcontratistas de este, sus datos SÍ deben incluirse aquí. Confirmar con
> el modelo de negocio real antes de firmar.

## 2. Descripción del tratamiento

| Aspecto | Detalle |
|---|---|
| Categorías de titulares | Clientes Finales de EL RESPONSABLE; [Armadores, si aplica] |
| Categorías de datos | Nombre, dirección, teléfono, correo electrónico, municipio/departamento, datos de la orden de servicio, evidencia fotográfica/video del servicio prestado |
| Naturaleza del tratamiento | Almacenamiento, consulta, comunicación (notificaciones), geolocalización asociada a la orden |
| Finalidad del tratamiento | Exclusivamente la prestación del Servicio (gestión de órdenes de armado de muebles) conforme a las instrucciones de EL RESPONSABLE |
| Duración | Mientras esté vigente el Contrato Principal, más el período de retención definido en la Cláusula 7 |

## 3. Instrucciones de tratamiento

3.1. EL ENCARGADO tratará los datos personales únicamente conforme a las instrucciones
documentadas de EL RESPONSABLE, las cuales se entienden dadas mediante: (i) la
configuración y uso ordinario de la Plataforma, y (ii) instrucciones adicionales por
escrito que EL RESPONSABLE curse a EL ENCARGADO.

3.2. Si EL ENCARGADO considera que una instrucción de EL RESPONSABLE infringe la
normativa de protección de datos aplicable, deberá informarlo inmediatamente, sin
obligación de ejecutar dicha instrucción hasta que se resuelva la discrepancia.

3.3. EL ENCARGADO no utilizará los datos personales para fines distintos a la
prestación del Servicio, ni los usará para su propio beneficio comercial (ej. entrenar
modelos de terceros con datos de Clientes Finales, venderlos, o cederlos fuera de lo
aquí pactado).

## 4. Subencargados de tratamiento (subprocesadores)

4.1. EL RESPONSABLE autoriza a EL ENCARGADO a utilizar a los siguientes subencargados
para la prestación del Servicio:

| Subencargado | Servicio prestado | Datos que procesa |
|---|---|---|
| Vercel Inc. | Hosting e infraestructura | Todos los datos que transitan por la Plataforma |
| Supabase | Base de datos | Todos los datos personales almacenados |
| Cloudinary Inc. | Almacenamiento de imágenes/video | Evidencia fotográfica y de video |
| Mapbox Inc. | Geolocalización y mapas | Coordenadas GPS, direcciones |
| Resend | Envío de correos transaccionales | Nombre, correo, contenido de notificaciones |
| Upstash Inc. | Cache / control de tráfico | Identificadores técnicos (no persistentes) |

4.2. EL ENCARGADO se compromete a suscribir con cada subencargado obligaciones de
protección de datos equivalentes a las aquí establecidas.

4.3. EL ENCARGADO notificará a EL RESPONSABLE con al menos [15/30] días de anticipación
cualquier cambio en la lista de subencargados (incorporación o sustitución), otorgando a
EL RESPONSABLE la posibilidad de oponerse por causa justificada relacionada con la
protección de datos.

## 5. Medidas de seguridad

EL ENCARGADO implementará y mantendrá las siguientes medidas técnicas y organizativas:

- Cifrado de contraseñas mediante funciones hash seguras (bcrypt).
- Comunicaciones cifradas mediante HTTPS/TLS.
- Control de acceso basado en roles (administrador, supervisor, armador, cliente).
- Autenticación mediante tokens de sesión firmados con expiración.
- Límites de tasa de peticiones (rate limiting) para prevenir abuso.
- Registro de auditoría (audit log) de acciones administrativas sensibles.
- Validación de origen (CSRF) en operaciones de modificación de datos.

> ⚠️ Este listado debe mantenerse actualizado conforme evolucione la implementación
> técnica real del sistema. No declarar medidas que no estén efectivamente implementadas.

## 6. Transferencias internacionales

Los subencargados listados en la Cláusula 4 operan principalmente desde infraestructura
ubicada en Estados Unidos. EL RESPONSABLE autoriza expresamente dichas transferencias
internacionales como necesarias para la prestación del Servicio, sujeto a que EL
ENCARGADO mantenga las salvaguardas contractuales correspondientes con cada
subencargado.

## 7. Retención y eliminación de datos

7.1. Al término del Contrato Principal, por cualquier causa, EL ENCARGADO pondrá a
disposición de EL RESPONSABLE, por un plazo de [30] días, la exportación de los datos
personales tratados.

7.2. Transcurrido dicho plazo, EL ENCARGADO eliminará o anonimizará los datos
personales, salvo que deba conservarlos por un período adicional en cumplimiento de una
obligación legal (ej. fiscal), en cuyo caso lo hará únicamente para dicho fin y con
acceso restringido.

## 8. Notificación de brechas de seguridad

EL ENCARGADO notificará a EL RESPONSABLE, sin dilación indebida y en un plazo no mayor a
[48/72] horas desde que tenga conocimiento, cualquier incidente de seguridad que pudiera
afectar la confidencialidad, integridad o disponibilidad de los datos personales
tratados, proporcionando la información disponible sobre: naturaleza del incidente,
categorías y volumen aproximado de datos afectados, y medidas adoptadas o propuestas
para mitigarlo.

## 9. Derechos de los titulares (ARCO)

Si un Cliente Final ejerce directamente ante EL ENCARGADO alguno de sus derechos de
Acceso, Rectificación, Cancelación u Oposición, EL ENCARGADO remitirá la solicitud a EL
RESPONSABLE dentro de [5] días hábiles, y prestará a EL RESPONSABLE la colaboración
razonable necesaria para atenderla dentro de los plazos legales, sin resolverla
directamente salvo instrucción expresa de EL RESPONSABLE.

## 10. Auditoría

EL RESPONSABLE podrá solicitar a EL ENCARGADO, con una periodicidad razonable (ej. una
vez al año) y previa notificación con al menos [15] días de anticipación, información
que acredite el cumplimiento de las obligaciones aquí establecidas. EL ENCARGADO podrá
optar por atender dicha solicitud mediante la entrega de informes de auditoría o
certificaciones de sus subencargados, en lugar de permitir una auditoría física, salvo
que exista una causa justificada que lo amerite (ej. sospecha fundada de
incumplimiento).

## 11. Responsabilidad

Cada Parte responderá por los daños y perjuicios que cause a la otra o a los titulares
de los datos por el incumplimiento de sus obligaciones bajo este DPA, conforme a la
legislación aplicable y a los límites de responsabilidad pactados en el Contrato
Principal, salvo en lo que dichos límites resulten inaplicables por disposición legal
imperativa en materia de protección de datos.

## 12. Vigencia

Este DPA estará vigente mientras lo esté el Contrato Principal y sobrevivirá en lo
relativo a las obligaciones de confidencialidad, retención y eliminación de datos aun
después de su terminación.

---

En fe de lo anterior, las Partes firman el presente Anexo en la ciudad de San Salvador,
a los [DÍA] días del mes de [MES] de [AÑO].

**Por EL RESPONSABLE:**                        **Por EL ENCARGADO:**

_____________________________                 _____________________________
[Nombre del representante]                     [Nombre del representante]
[Razón social del cliente]                     Punto Cero S.A.S. de C.V.

---

## Notas para el abogado revisor

- **Prioridad #1**: resolver la calificación jurídica de los Armadores (¿son terceros
  respecto del Cliente, o son personal directo de Punto Cero?) antes de definir el
  alcance exacto de este DPA — es la decisión que más cambia el documento completo.
- Confirmar si la LPDP de El Salvador usa terminología equivalente a "responsable" y
  "encargado" (como en GDPR/LOPD española) o tiene su propia nomenclatura — ajustar el
  documento a la terminología legal exacta vigente.
- Validar si se requiere cláusulas contractuales estándar específicas para la
  transferencia a EE.UU., o si basta con la autorización contractual genérica de la
  Cláusula 6.
- Confirmar plazos de notificación de brechas (Cláusula 8) contra lo que exija la ley
  salvadoreña — el plazo de 48-72h es un estándar internacional común (GDPR usa 72h),
  pero debe validarse contra la norma local.
