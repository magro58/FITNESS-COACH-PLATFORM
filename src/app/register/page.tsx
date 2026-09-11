import { oauthProvidersConfigured, type OAuthProviderId } from "@/lib/oauth";
import { RegisterFormClient } from "./RegisterFormClient";

export default function RegisterPage() {
  const configuredProviders = (Object.keys(oauthProvidersConfigured) as OAuthProviderId[]).filter(
    (id) => oauthProvidersConfigured[id]
  );

  return <RegisterFormClient configuredProviders={configuredProviders} />;
}
