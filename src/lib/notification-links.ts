import type { Role } from "@prisma/client";

export function notificationHref(
  n: { resourceType: string | null; resourceId: string | null },
  role: Role
): string | null {
  if (!n.resourceType || !n.resourceId) return null;
  switch (n.resourceType) {
    case "plan":
      return role === "STUDENT" ? `/my-plan/${n.resourceId}` : `/plans/${n.resourceId}`;
    case "media":
      return `/media?highlight=${n.resourceId}`;
    case "link":
      return `/media?tab=links&highlight=${n.resourceId}`;
    case "student":
      return role === "TRAINER" ? `/students/${n.resourceId}` : `/dashboard`;
    case "ticket":
      return role === "ADMIN" ? `/admin/tickets/${n.resourceId}` : `/support/${n.resourceId}`;
    default:
      return null;
  }
}
