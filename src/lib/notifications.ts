import { prisma } from "@/lib/prisma";
import { realtimeBus } from "@/lib/realtime";
import type { NotificationType, Prisma } from "@prisma/client";

export async function notify(params: {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  resourceType?: string;
  resourceId?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
    },
  });

  realtimeBus.publish(params.userId, {
    type: "notification",
    payload: notification,
  });

  return notification;
}

export async function logActivity(params: {
  trainerId: string;
  studentId: string;
  type: string;
  message: string;
  metadata?: Record<string, unknown>;
}) {
  const event = await prisma.activityEvent.create({
    data: {
      trainerId: params.trainerId,
      studentId: params.studentId,
      type: params.type,
      message: params.message,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
    },
  });

  realtimeBus.publish(params.trainerId, {
    type: "activity",
    payload: event,
  });

  return event;
}
