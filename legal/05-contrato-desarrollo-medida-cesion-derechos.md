# Contrato de Desarrollo de Software a la Medida con Cesión de Derechos de Autor

> ⚠️ **PLANTILLA — requiere revisión de abogado antes de usarse.** Ver [README.md](README.md).
>
> **Nota de aplicabilidad:** Este documento NO aplica a Armados 2Go en su modelo actual
> (Armados 2Go es un producto SaaS propio de Punto Cero, licenciado — no un desarrollo a
> la medida para un cliente específico). Se incluye porque Punto Cero, como empresa de
> software, probablemente realiza o realizará proyectos de desarrollo a medida para
> otros clientes (ej. features custom, integraciones, u otros de los proyectos vistos en
> el workspace: Conta_2go, Drive2go, etc.). Úsalo cuando ese sea el caso, adaptando el
> objeto del contrato al proyecto específico.

**Fecha:** [FECHA DE FIRMA]

Entre:

**EL DESARROLLADOR:** Punto Cero S.A.S. de C.V., con NIT [NIT], con domicilio en
[DIRECCIÓN], representada por [NOMBRE DEL REPRESENTANTE], en adelante "EL DESARROLLADOR".

**EL CLIENTE:** [RAZÓN SOCIAL], con NIT [NIT], con domicilio en [DIRECCIÓN], representada
por [NOMBRE DEL REPRESENTANTE], en adelante "EL CLIENTE".

---

## Cláusula Primera — Objeto del Contrato

EL DESARROLLADOR se obliga a diseñar, desarrollar e implementar para EL CLIENTE el
software descrito en el **Anexo A — Especificación del Proyecto** (el "Software a
Medida"), conforme a los requerimientos, alcance, cronograma y entregables ahí
detallados.

## Cláusula Segunda — Alcance y Entregables

2.1. El alcance del proyecto, incluyendo funcionalidades, integraciones, plataformas
objetivo y criterios de aceptación, se detalla en el Anexo A.

2.2. Cualquier requerimiento adicional o modificación al alcance original que implique
trabajo adicional deberá acordarse mediante una **Orden de Cambio** firmada por ambas
Partes, la cual podrá ajustar plazo y/o precio.

2.3. EL DESARROLLADOR entregará el Software a Medida conforme al cronograma pactado,
sujeto a que EL CLIENTE proporcione oportunamente la información, accesos y
retroalimentación necesarios para el avance del proyecto.

## Cláusula Tercera — Precio y Forma de Pago

3.1. El precio total del proyecto es de [MONTO], pagadero conforme al siguiente
calendario: [DEFINIR HITOS DE PAGO — ej. 30% al inicio, 40% a entrega de MVP, 30% a
aceptación final].

3.2. Los pagos no incluyen impuestos aplicables, los cuales correrán por cuenta de EL
CLIENTE conforme a la legislación salvadoreña.

3.3. El atraso en el pago de cualquier hito facultará a EL DESARROLLADOR a suspender el
proyecto hasta la regularización del pago, sin que ello se compute dentro del
cronograma pactado.

## Cláusula Cuarta — Propiedad Intelectual y Cesión de Derechos

**Esta es la cláusula central del presente Contrato y define quién es dueño del código
al finalizar el proyecto.**

4.1. **Cesión del Software a Medida.** Una vez recibido el pago íntegro y completo del
precio pactado en la Cláusula Tercera, EL DESARROLLADOR cede a EL CLIENTE, de forma
exclusiva, irrevocable y por el plazo máximo permitido por la ley, todos los derechos
patrimoniales de autor sobre el código fuente y código objeto del Software a Medida
desarrollado específicamente para EL CLIENTE bajo este Contrato, incluyendo el derecho
de reproducción, transformación, distribución y comunicación pública.

4.2. **Componentes preexistentes y de terceros.** Se exceptúan de la cesión anterior:

a) **Componentes preexistentes de EL DESARROLLADOR**: librerías, frameworks internos,
plantillas, snippets o módulos genéricos que EL DESARROLLADOR haya creado con
anterioridad a este Contrato o de forma independiente al mismo, y que reutilice en el
desarrollo del Software a Medida (en adelante, "Herramientas Base"). Sobre las
Herramientas Base, EL DESARROLLADOR otorga a EL CLIENTE una **licencia de uso perpetua,
no exclusiva e irrevocable**, limitada a su uso como parte integrante del Software a
Medida, sin derecho a explotarlas de forma independiente o a sublicenciarlas a terceros
fuera de dicho contexto.

b) **Software de código abierto y librerías de terceros**: cualquier dependencia de
código abierto (npm, librerías públicas, frameworks como Next.js, React, etc.)
utilizada en el desarrollo se rige por su propia licencia (MIT, Apache 2.0, etc.), la
cual EL CLIENTE deberá respetar. EL DESARROLLADOR no cede ni puede ceder derechos sobre
dicho software de terceros.

4.3. **Listado de Herramientas Base.** EL DESARROLLADOR deberá identificar en el Anexo B
las Herramientas Base y librerías de terceros relevantes que se incorporen al Software a
Medida, para claridad de ambas Partes.

> ⚠️ **Punto crítico**: sin este listado (Anexo B), en caso de disputa será difícil
> demostrar qué código era "preexistente" de Punto Cero y qué código fue creado
> específicamente para el Cliente. El abogado debe insistir en que el equipo técnico
> mantenga este anexo actualizado durante el proyecto, idealmente con evidencia en el
> control de versiones (ej. un commit inicial mostrando el punto de partida).

4.4. **Derechos morales.** Los derechos morales de autor (paternidad, integridad de la
obra) corresponden a los autores individuales que participaron en el desarrollo
conforme a la ley, y no son objeto de cesión, sin perjuicio de que EL DESARROLLADOR se
obliga a no ejercerlos de forma que impida a EL CLIENTE el uso, modificación o
explotación comercial del Software a Medida.

4.5. **Efectividad de la cesión.** La cesión de derechos establecida en esta cláusula
queda **condicionada al pago íntegro** del precio pactado. En caso de incumplimiento de
pago, EL DESARROLLADOR conservará la titularidad de los derechos patrimoniales sobre el
Software a Medida hasta la regularización de dicho pago.

## Cláusula Quinta — Entrega del Código Fuente

5.1. A la finalización del proyecto y verificado el pago conforme a la Cláusula
Cuarta, EL DESARROLLADOR entregará a EL CLIENTE el código fuente completo del Software a
Medida, incluyendo el historial de control de versiones (ej. repositorio Git), mediante
[transferencia de propiedad del repositorio / entrega de archivo comprimido — definir].

5.2. EL DESARROLLADOR también entregará la documentación técnica razonablemente
necesaria para que EL CLIENTE o un tercero puedan mantener y operar el Software a
Medida, conforme a lo detallado en el Anexo A.

## Cláusula Sexta — Garantía

6.1. EL DESARROLLADOR garantiza que el Software a Medida funcionará sustancialmente
conforme a las especificaciones del Anexo A durante un período de [30/60/90] días
posteriores a la entrega final ("Período de Garantía"), comprometiéndose a corregir,
sin costo adicional, los defectos (bugs) que se identifiquen durante dicho período y que
sean atribuibles a errores de desarrollo.

6.2. La garantía no cubre: (i) modificaciones realizadas por EL CLIENTE o terceros no
autorizados, (ii) uso del Software fuera de las condiciones especificadas, (iii) fallas
de infraestructura de terceros (hosting, servicios externos) no operados por EL
DESARROLLADOR.

## Cláusula Séptima — Confidencialidad

Ambas Partes se obligan a mantener confidencial la información técnica y comercial
intercambiada con motivo del proyecto, incluyendo credenciales de acceso, datos de
negocio y cualquier información marcada como confidencial, no divulgándola a terceros
sin autorización previa y por escrito.

## Cláusula Octava — Limitación de Responsabilidad

La responsabilidad total de EL DESARROLLADOR frente a EL CLIENTE derivada de este
Contrato no excederá el monto total pagado por EL CLIENTE bajo el mismo. EL
DESARROLLADOR no será responsable por daños indirectos, lucro cesante, o pérdidas
derivadas del uso del Software a Medida más allá de las especificaciones acordadas.

## Cláusula Novena — Terminación Anticipada

9.1. EL CLIENTE podrá terminar el Contrato en cualquier momento, pagando el trabajo
efectivamente realizado hasta la fecha de terminación, calculado proporcionalmente
conforme al Anexo A.

9.2. En caso de terminación anticipada por EL CLIENTE sin causa imputable a EL
DESARROLLADOR, la cesión de derechos de la Cláusula Cuarta aplicará únicamente sobre el
código efectivamente pagado hasta ese momento.

## Cláusula Décima — Legislación Aplicable

Este Contrato se rige por las leyes de la República de El Salvador, incluyendo la
normativa aplicable en materia de propiedad intelectual (derechos de autor sobre
software).

## Cláusula Décima Primera — Anexos

- **Anexo A** — Especificación del Proyecto (alcance, cronograma, precio, hitos)
- **Anexo B** — Listado de Herramientas Base y librerías de terceros preexistentes

---

En fe de lo anterior, las Partes firman el presente Contrato en la ciudad de San
Salvador, a los [DÍA] días del mes de [MES] de [AÑO].

**Por EL DESARROLLADOR:**                      **Por EL CLIENTE:**

_____________________________                 _____________________________
[Nombre del representante]                     [Nombre del representante]
Punto Cero S.A.S. de C.V.                      [Razón social del cliente]

---

## Notas para el abogado revisor

- La Cláusula 4.5 (cesión condicionada al pago) es la protección más importante para
  Punto Cero como desarrollador — validar que sea enforceable y que el lenguaje sea
  suficientemente claro para un juez salvadoreño.
- Insistir con el equipo de negocio en mantener el Anexo B actualizado en cada proyecto
  real — es la evidencia que distingue "código propio reutilizado" de "código creado
  para el cliente", y sin ella la empresa pierde capacidad de reutilizar sus propias
  herramientas en proyectos futuros.
- Confirmar si El Salvador tiene un registro de derechos de autor de software
  recomendable para reforzar la prueba de titularidad (algunos países lo permiten aunque
  no sea obligatorio).
- Adaptar el Anexo A a cada proyecto específico — este documento es una plantilla
  reutilizable, no debe firmarse sin un Anexo A concreto.
