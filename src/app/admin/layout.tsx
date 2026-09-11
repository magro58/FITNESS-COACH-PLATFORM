import { redirect } from "next/navigation";
import { getCurrentUser, clearSessionCookie } from "@/lib/auth";
import { UserProvider } from "@/components/user-context";
import { AdminShell } from "@/components/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) {
    await clearSessionCookie();
    redirect("/login?disabled=1");
  }
  if (user.role !== "ADMIN") redirect("/dashboard");

  const serializedUser = {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.profile
      ? {
          id: user.profile.id,
          displayName: user.profile.displayName,
          bio: user.profile.bio,
          photoUrl: user.profile.photoUrl,
          avatarConfig: user.profile.avatarConfig as never,
          useAvatar: user.profile.useAvatar,
        }
      : null,
  };

  return (
    <UserProvider user={serializedUser}>
      <AdminShell>{children}</AdminShell>
    </UserProvider>
  );
}
