import { redirect } from "next/navigation";
import { getCurrentUser, getSession, clearSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserProvider } from "@/components/user-context";
import { AppShell } from "@/components/AppShell";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) {
    await clearSessionCookie();
    redirect("/login?disabled=1");
  }
  if (user.role === "ADMIN") redirect("/admin");

  const session = await getSession();
  const adminId = typeof session?.impersonatedBy === "string" ? session.impersonatedBy : null;
  const impersonatingAdmin = adminId
    ? await prisma.user.findUnique({ where: { id: adminId }, select: { email: true } })
    : null;

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
      {impersonatingAdmin && (
        <ImpersonationBanner
          displayName={user.profile?.displayName ?? user.email}
          roleLabel={user.role === "TRAINER" ? "Personal Trainer" : "Allievo"}
          adminEmail={impersonatingAdmin.email}
        />
      )}
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
