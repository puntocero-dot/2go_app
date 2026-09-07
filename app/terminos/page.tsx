import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell, LegalSection } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Términos y Condiciones — Armados 2Go",
  description: "Términos y condiciones de uso de la plataforma Armados 2Go.",
};

const LAST_UPDATED = "7 de septiembre de 2026";

export default function TerminosPage() {
  return (
    <LegalPageShell title="Términos y Condiciones de Uso" lastUpdated={LAST_UPDATED}>
      <p>
        Estos Términos y Condiciones (&quot;Términos&quot;) rigen el acceso y uso de la
        plataforma Armados 2Go (el &quot;Servicio&quot;), operada por{" "}
        <strong>Punto Cero S.A.S. de C.V.</strong> (&quot;Punto Cero&quot;,
        &quot;nosotros&quot;), disponible en{" "}
        <a href="https://www.armados2go.com" className="text-[#1da1f2] hover:underline">
          www.armados2go.com
        </a>{" "}
        y sus aplicaciones asociadas.
      </p>
      <p>
        Al crear una cuenta, iniciar sesión o utilizar el Servicio de cualquier forma,
        usted (&quot;Usuario&quot;) acepta quedar vinculado por estos Términos. Si no
        está de acuerdo, no debe utilizar el Servicio.
      </p>
      <p>
        El Servicio está diseñado para distintos tipos de usuario: administradores y
        supervisores de empresas que contratan Armados 2Go (el &quot;Cliente&quot;),
        personal de campo encargado del armado de muebles (&quot;Armadores&quot;), y
        consumidores finales que reciben el servicio de armado (&quot;Clientes
        Finales&quot;). Las secciones que apliquen específicamente a un tipo de usuario
        lo indican expresamente.
      </p>

      <LegalSection title="1. Descripción del Servicio">
        <p>
          Armados 2Go es una plataforma tecnológica que permite gestionar órdenes de
          trabajo de armado de muebles, incluyendo asignación de personal, seguimiento en
          tiempo real, comunicación con clientes finales y generación de reportes. Punto
          Cero provee la tecnología; el servicio de armado de muebles en sí es prestado
          por el Cliente y/o sus Armadores, no por Punto Cero.
        </p>
      </LegalSection>

      <LegalSection title="2. Cuentas de Usuario">
        <p>
          Para acceder a ciertas funciones del Servicio, el Usuario debe contar con una
          cuenta creada por un administrador autorizado del Cliente. El Usuario es
          responsable de mantener la confidencialidad de sus credenciales de acceso.
        </p>
        <p>
          El Usuario se compromete a proporcionar información veraz, completa y
          actualizada al momento de su registro y durante el uso del Servicio.
        </p>
        <p>
          El Servicio no está dirigido a menores de 18 años. Al usar el Servicio, el
          Usuario declara ser mayor de edad conforme a la legislación salvadoreña.
        </p>
      </LegalSection>

      <LegalSection title="3. Uso Aceptable">
        <p>El Usuario se compromete a no:</p>
        <ul className="list-disc list-inside space-y-1.5 pl-2">
          <li>Utilizar el Servicio para fines ilícitos o no autorizados.</li>
          <li>
            Intentar acceder sin autorización a cuentas, sistemas o datos de otros
            usuarios.
          </li>
          <li>
            Interferir con el funcionamiento normal del Servicio (ataques de denegación
            de servicio, scraping masivo, ingeniería inversa, etc.).
          </li>
          <li>
            Publicar o transmitir contenido difamatorio, ofensivo, fraudulento o que
            infrinja derechos de terceros a través de las funciones de comunicación del
            Servicio.
          </li>
          <li>Suplantar la identidad de otra persona o entidad.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Geolocalización y Datos de Ubicación (Armadores)">
        <p>
          La función de Armador dentro del Servicio incluye el registro y transmisión de
          la ubicación geográfica (GPS) del dispositivo del Armador durante sus turnos
          activos, con el propósito de: (i) asignación eficiente de órdenes, (ii) cálculo
          de tiempos estimados de llegada (ETA) para el Cliente Final, y (iii) generación
          de reportes de rutas para el Cliente.
        </p>
        <p>
          El Armador consiente expresamente la recolección de su ubicación durante los
          períodos en que su turno esté activo en la Plataforma. El Armador puede
          desactivar la geolocalización deteniendo su turno, entendiendo que ello puede
          afectar su capacidad de recibir asignaciones. Punto Cero no recolecta ubicación
          del Armador fuera de sus turnos activos.
        </p>
      </LegalSection>

      <LegalSection title="5. Evidencia Fotográfica y de Video">
        <p>
          El Servicio permite a los Armadores subir fotografías y/o videos como evidencia
          del trabajo realizado. El Armador declara contar con el consentimiento de las
          personas que pudieran aparecer en dicho material o haber tomado el material
          evitando capturar personas identificables cuando no sea necesario para la
          evidencia del trabajo.
        </p>
        <p>
          Dicho material se almacena a través de un proveedor externo de almacenamiento
          en la nube y es accesible únicamente por el Cliente y por Punto Cero para
          fines de soporte y resolución de disputas.
        </p>
      </LegalSection>

      <LegalSection title="6. Comunicaciones y Notificaciones">
        <p>
          Al usar el Servicio, el Usuario acepta recibir comunicaciones relacionadas con
          el Servicio (confirmaciones de orden, actualizaciones de estado, notificaciones
          push, correos electrónicos transaccionales) a través de los canales de contacto
          que haya proporcionado.
        </p>
      </LegalSection>

      <LegalSection title="7. Propiedad Intelectual">
        <p>
          Todo el contenido, diseño, marcas y elementos del Servicio son propiedad de
          Punto Cero o de sus licenciantes. Estos Términos no otorgan al Usuario ningún
          derecho de propiedad intelectual sobre el Servicio, salvo el derecho limitado
          de uso aquí descrito.
        </p>
      </LegalSection>

      <LegalSection title="8. Contenido del Usuario">
        <p>
          El Usuario conserva la titularidad de la información y archivos que suba al
          Servicio. Al subir dicho contenido, el Usuario otorga a Punto Cero una licencia
          limitada para almacenarlo, procesarlo y mostrarlo dentro del Servicio,
          exclusivamente para los fines de prestación del mismo.
        </p>
      </LegalSection>

      <LegalSection title="9. Suspensión y Terminación de Cuenta">
        <p>
          Punto Cero, o el Cliente administrador de la cuenta, podrá suspender o eliminar
          el acceso de un Usuario que incumpla estos Términos, sin perjuicio de las
          acciones legales que correspondan.
        </p>
      </LegalSection>

      <LegalSection title="10. Disponibilidad del Servicio">
        <p>
          El Servicio se provee &quot;tal cual&quot; y &quot;según disponibilidad&quot;.
          Punto Cero no garantiza operación ininterrumpida o libre de errores, si bien
          realiza esfuerzos razonables para mantener la disponibilidad y corregir fallas
          reportadas.
        </p>
      </LegalSection>

      <LegalSection title="11. Limitación de Responsabilidad">
        <p>
          Punto Cero es proveedor de la tecnología, no del servicio de armado de
          muebles. Punto Cero no será responsable por la calidad del trabajo de armado
          realizado por los Armadores, por daños al mobiliario, ni por conductas de los
          Armadores durante la prestación del servicio, cuya responsabilidad corresponde
          al Cliente y/o al Armador conforme a la relación contractual que corresponda.
        </p>
        <p>
          En la máxima medida permitida por la ley aplicable, Punto Cero no será
          responsable por daños indirectos, incidentales o consecuenciales derivados del
          uso del Servicio.
        </p>
      </LegalSection>

      <LegalSection title="12. Privacidad">
        <p>
          El tratamiento de datos personales del Usuario se rige por nuestro{" "}
          <Link href="/privacidad" className="text-[#1da1f2] hover:underline">
            Aviso de Privacidad
          </Link>
          , el cual forma parte integral de estos Términos.
        </p>
      </LegalSection>

      <LegalSection title="13. Modificaciones a los Términos">
        <p>
          Punto Cero podrá modificar estos Términos en cualquier momento. Los cambios
          serán notificados mediante publicación en el Servicio o por correo
          electrónico, con al menos 15 días de anticipación para cambios sustanciales.
          El uso continuado del Servicio tras la entrada en vigor de los cambios
          constituye aceptación de los mismos.
        </p>
      </LegalSection>

      <LegalSection title="14. Legislación Aplicable">
        <p>Estos Términos se rigen por las leyes de la República de El Salvador.</p>
      </LegalSection>

      <LegalSection title="15. Contacto">
        <p>
          Para consultas sobre estos Términos, escríbanos a{" "}
          <a
            href="mailto:admin@armados2go.com"
            className="text-[#1da1f2] hover:underline"
          >
            admin@armados2go.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
