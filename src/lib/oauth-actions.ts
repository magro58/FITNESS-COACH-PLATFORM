"use server";

import { signIn } from "@/lib/oauth";
import type { OAuthProviderId } from "@/lib/oauth";

async function startOAuth(provider: OAuthProviderId) {
  await signIn(provider, { redirectTo: "/api/oauth-bridge" });
}

export async function signInWithGoogle() {
  await startOAuth("google");
}

export async function signInWithMicrosoft() {
  await startOAuth("microsoft-entra-id");
}

export async function signInWithApple() {
  await startOAuth("apple");
}
