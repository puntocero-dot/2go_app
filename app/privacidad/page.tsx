import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Aviso de Privacidad — Armados 2Go",
  description: "Aviso de privacidad y tratamiento de datos personales de Armados 2Go.",
};

const LAST_UPDATED = "7 de septiembre de 2026";

export default function PrivacidadPage() {
  return (
    <LegalPageShell title="Aviso de Privacidad" lastUpdated={LAST_UPDATED}>
      <p>
        <strong>Punto Cero S.A.S. de C.V.</strong> (&quot;Punto Cero&quot;,
        &quot;nosotros&quot;), con domicilio en San Salvador, El Salvador, es responsable
        del tratamiento de los datos personales que se recaban a través de la plataforma
        Armados 2Go (el &quot;Servicio&quot;), conforme a la normativa de protección de
        datos personales de la República de El Salvador.
      </p>
      <p>
        Este Aviso de Privacidad describe qué datos personales recolectamos, con qué
        finalidad, con quién los compartimos, y cómo puede ejercer sus derechos.
      </p>

      <LegalSection title="1. ¿A quién aplica este Aviso?">
        <p>
          Este Aviso aplica a toda persona cuyos datos personales sean tratados a través
          del Servicio, incluyendo administradores y supervisores de empresas Cliente,
          Armadores (personal de campo que presta el servicio de armado), y Clientes
          Finales (consumidores que reciben el servicio de armado de muebles).
        </p>
      </LegalSection>

      <LegalSection title="2. Datos personales que recolectamos">
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>
            <strong>Identificación y contacto:</strong> nombre, correo electrónico,
            teléfono, dirección.
          </li>
          <li>
            <strong>Credenciales de acceso:</strong> contraseña (almacenada cifrada),
            sesión.
          </li>
          <li>
            <strong>Ubicación (GPS):</strong> coordenadas geográficas en tiempo real
            durante turnos activos de los Armadores.
          </li>
          <li>
            <strong>Evidencia del servicio:</strong> fotografías y video subidos por
            Armadores como evidencia del trabajo.
          </li>
          <li>
            <strong>Datos de la orden de trabajo:</strong> dirección de entrega,
            municipio, departamento, notas de la orden.
          </li>
          <li>
            <strong>Datos técnicos:</strong> dirección IP, tipo de dispositivo, registros
            de acceso.
          </li>
        </ul>
        <p>
          No recolectamos datos sensibles (salud, religión, orientación sexual,
          afiliación política o sindical, datos biométricos).
        </p>
      </LegalSection>

      <LegalSection title="3. Finalidades del tratamiento">
        <p>Tratamos los datos personales para las siguientes finalidades:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Gestionar el registro y autenticación de cuentas.</li>
          <li>Asignar y dar seguimiento a órdenes de trabajo.</li>
          <li>Calcular tiempos estimados de llegada y optimizar rutas.</li>
          <li>Generar comprobantes, reportes y facturación para el Cliente.</li>
          <li>Enviar notificaciones operativas (confirmaciones, cambios de estado).</li>
          <li>Brindar soporte técnico.</li>
          <li>Prevenir fraude y garantizar la seguridad de la Plataforma.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Con quién compartimos los datos">
        <p>
          Compartimos datos personales con proveedores externos que nos brindan
          infraestructura tecnológica (hosting, base de datos, almacenamiento de
          imágenes, mapas y geolocalización, envío de correos electrónicos, y control de
          tráfico), únicamente en la medida necesaria para operar el Servicio. Estos
          proveedores operan bajo sus propios compromisos de seguridad y confidencialidad
          de datos.
        </p>
        <p>
          Los datos de Clientes Finales y de Armadores son visibles para el Cliente
          (empresa que contrató el Servicio) que los generó, en su calidad de responsable
          de dicha información.
        </p>
        <p>
          <strong>No vendemos</strong> datos personales a terceros para fines de
          mercadeo.
        </p>
      </LegalSection>

      <LegalSection title="5. Transferencias internacionales de datos">
        <p>
          Algunos de nuestros proveedores de infraestructura operan desde servidores
          ubicados fuera de El Salvador (principalmente Estados Unidos), por lo que sus
          datos personales podrán ser transferidos y procesados en dichos países.
          Exigimos contractualmente a estos proveedores la implementación de medidas de
          seguridad adecuadas para la protección de la información.
        </p>
      </LegalSection>

      <LegalSection title="6. Plazo de conservación">
        <p>
          Conservamos los datos personales durante la vigencia de la relación con el
          Cliente y por un período adicional razonable posterior a la terminación del
          contrato, para atender obligaciones legales, fiscales o para la defensa ante
          reclamos, transcurrido el cual serán eliminados o anonimizados.
        </p>
      </LegalSection>

      <LegalSection title="7. Sus derechos sobre sus datos">
        <p>Usted tiene derecho a:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>
            <strong>Acceder</strong> a sus datos personales en nuestro poder.
          </li>
          <li>
            <strong>Rectificar</strong> datos inexactos o incompletos.
          </li>
          <li>
            <strong>Cancelar</strong> sus datos cuando ya no sean necesarios para las
            finalidades que motivaron su tratamiento.
          </li>
          <li>
            <strong>Oponerse</strong> al tratamiento para finalidades específicas.
          </li>
          <li>
            <strong>Revocar</strong> su consentimiento en cualquier momento, cuando el
            tratamiento se base en consentimiento.
          </li>
        </ul>
        <p>
          Para ejercer estos derechos, escríbanos a{" "}
          <a
            href="mailto:admin@armados2go.com"
            className="text-[#1da1f2] hover:underline"
          >
            admin@armados2go.com
          </a>
          , indicando su nombre completo y una descripción clara de su solicitud.
        </p>
      </LegalSection>

      <LegalSection title="8. Seguridad de los datos">
        <p>
          Implementamos medidas técnicas y organizativas razonables para proteger los
          datos personales, incluyendo cifrado de contraseñas, conexiones cifradas
          (HTTPS), control de acceso basado en roles, límites de tasa de peticiones y
          registro de auditoría de acciones administrativas.
        </p>
      </LegalSection>

      <LegalSection title="9. Menores de edad">
        <p>
          El Servicio no está dirigido a menores de 18 años y no recolectamos
          conscientemente datos de menores, salvo en la medida en que un adulto
          responsable ingrese datos de un Cliente Final que pudiera ser menor (por
          ejemplo, dirección de entrega a nombre de una familia).
        </p>
      </LegalSection>

      <LegalSection title="10. Cambios a este Aviso">
        <p>
          Podemos actualizar este Aviso de Privacidad periódicamente. Los cambios
          sustanciales serán notificados a través del Servicio o por correo electrónico.
        </p>
      </LegalSection>

      <LegalSection title="11. Contacto">
        <p>
          <strong>Punto Cero S.A.S. de C.V.</strong>
          <br />
          San Salvador, El Salvador
          <br />
          Correo:{" "}
          <a
            href="mailto:admin@armados2go.com"
            className="text-[#1da1f2] hover:underline"
          >
            admin@armados2go.com
          </a>
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
