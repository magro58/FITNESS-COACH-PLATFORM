import { redirect } from "next/navigation";
import { getPendingOAuthIdentity } from "@/lib/auth";
import { CompleteOAuthForm } from "./CompleteOAuthForm";

export default async function CompleteOAuthPage() {
  const pending = await getPendingOAuthIdentity();
  if (!pending) redirect("/register");

  return <CompleteOAuthForm email={pending.email} name={pending.name} />;
}
