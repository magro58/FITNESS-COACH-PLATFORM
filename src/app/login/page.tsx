import { oauthProvidersConfigured, type OAuthProviderId } from "@/lib/oauth";
import { LoginFormClient } from "./LoginFormClient";

export default function LoginPage() {
  const configuredProviders = (Object.keys(oauthProvidersConfigured) as OAuthProviderId[]).filter(
    (id) => oauthProvidersConfigured[id]
  );

  return <LoginFormClient configuredProviders={configuredProviders} />;
}
