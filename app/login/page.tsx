import { LoginForm } from "@/components/login-form";
import { getLoginBackgroundUrl } from "@/lib/login-background-config";

// Sin esto, Next.js prerenderiza esta página como estática en el build
// y la imagen de fondo queda fija hasta el próximo deploy, ignorando
// los cambios guardados desde /admin/configuracion/login.
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const backgroundUrl = await getLoginBackgroundUrl();

  return <LoginForm backgroundUrl={backgroundUrl} />;
}
