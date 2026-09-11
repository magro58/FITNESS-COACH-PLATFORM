import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Apple from "next-auth/providers/apple";

// NextAuth is used ONLY to run the OAuth handshake with each provider (redirect,
// PKCE/state, token exchange, id_token verification). It keeps no session and
// no database of its own here (session: "jwt", no adapter): once a provider
// confirms who the user is, /api/oauth-bridge reads that short-lived NextAuth
// session once and hands off to this app's own session system (src/lib/auth.ts),
// which is what every route actually checks. This keeps the two auth paths
// (password login and OAuth login) converging on one session mechanism.

export const oauthProvidersConfigured = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  "microsoft-entra-id": !!(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET),
  apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
} as const;

export type OAuthProviderId = keyof typeof oauthProvidersConfigured;

const providers = [];

if (oauthProvidersConfigured.google) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (oauthProvidersConfigured["microsoft-entra-id"]) {
  providers.push(
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID ?? "common"}/v2.0`,
    })
  );
}

if (oauthProvidersConfigured.apple) {
  providers.push(
    Apple({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  basePath: "/api/oauth",
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    jwt({ token, account }) {
      if (account) token.provider = account.provider;
      return token;
    },
    session({ session, token }) {
      return { ...session, provider: token.provider as string | undefined };
    },
  },
});
