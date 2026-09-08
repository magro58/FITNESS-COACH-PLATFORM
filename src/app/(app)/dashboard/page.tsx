"use client";

import { useCurrentUser } from "@/components/user-context";
import { TrainerDashboard } from "@/components/dashboard/TrainerDashboard";
import { StudentDashboard } from "@/components/dashboard/StudentDashboard";

export default function DashboardPage() {
  const user = useCurrentUser();
  return user.role === "TRAINER" ? <TrainerDashboard /> : <StudentDashboard />;
}
