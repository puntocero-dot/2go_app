import { LoginForm } from "@/components/login-form";
import { getLoginBackgroundUrl } from "@/lib/login-background-config";

export default async function LoginPage() {
  const backgroundUrl = await getLoginBackgroundUrl();

  return <LoginForm backgroundUrl={backgroundUrl} />;
}
