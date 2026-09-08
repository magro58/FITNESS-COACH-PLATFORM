"use client";

import { createContext, useContext } from "react";
import type { Role } from "@prisma/client";
import type { AvatarConfig } from "@/lib/avatar";

export interface CurrentUser {
  id: string;
  email: string;
  role: Role;
  profile: {
    id: string;
    displayName: string;
    bio: string | null;
    photoUrl: string | null;
    avatarConfig: AvatarConfig | null;
    useAvatar: boolean;
  } | null;
}

const UserContext = createContext<CurrentUser | null>(null);

export function UserProvider({
  user,
  children,
}: {
  user: CurrentUser;
  children: React.ReactNode;
}) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useCurrentUser must be used within UserProvider");
  return ctx;
}
