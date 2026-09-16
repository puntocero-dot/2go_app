import { LoginForm } from "@/components/login-form";
import { getLoginBackgroundUrl } from "@/lib/login-background-config";

// force-dynamic consultaba la DB en CADA carga del login, añadiendo un
// round-trip completo antes de poder enviar el HTML — eso era la causa
// real de la lentitud percibida, no el peso de la imagen. Con ISR
// (revalidate) Next sirve la página desde caché y solo vuelve a
// consultar la config como máximo una vez por minuto, así que un cambio
// de fondo desde /admin/configuracion/login se refleja en ≤60s sin
// sacrificar velocidad en el resto de las cargas.
export const revalidate = 60;

export default async function LoginPage() {
  const backgroundUrl = await getLoginBackgroundUrl();

  return <LoginForm backgroundUrl={backgroundUrl} />;
}
