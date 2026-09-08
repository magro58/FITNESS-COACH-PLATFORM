import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserProvider } from "@/components/user-context";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

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
      <AppShell>{children}</AppShell>
    </UserProvider>
  );
}
