import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import type { TicketCategory } from "@prisma/client";

async function notifyAdmins(params: {
  title: string;
  body?: string;
  resourceType: string;
  resourceId: string;
}) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        type: "SUPPORT_TICKET_NEW",
        title: params.title,
        body: params.body,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
      })
    )
  );
}

export async function createTicket(params: {
  authorId: string;
  authorName: string;
  subject: string;
  category: TicketCategory;
  message: string;
}) {
  const ticket = await prisma.supportTicket.create({
    data: {
      authorId: params.authorId,
      subject: params.subject,
      category: params.category,
      messages: { create: { authorId: params.authorId, body: params.message } },
    },
    include: { messages: true },
  });

  await notifyAdmins({
    title: `Nuovo ticket: ${params.subject}`,
    body: `Da ${params.authorName}`,
    resourceType: "ticket",
    resourceId: ticket.id,
  });

  return ticket;
}

export async function replyToTicketAsAuthor(params: {
  ticketId: string;
  authorId: string;
  authorName: string;
  body: string;
}) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.ticketId } });
  if (!ticket || ticket.authorId !== params.authorId) return null;

  const message = await prisma.ticketMessage.create({
    data: { ticketId: params.ticketId, authorId: params.authorId, body: params.body },
  });

  await prisma.supportTicket.update({
    where: { id: params.ticketId },
    data: { status: ticket.status === "CLOSED" ? "OPEN" : ticket.status },
  });

  await notifyAdmins({
    title: `Nuovo messaggio nel ticket: ${ticket.subject}`,
    body: `Da ${params.authorName}`,
    resourceType: "ticket",
    resourceId: ticket.id,
  });

  return message;
}

export async function replyToTicketAsAdmin(params: {
  ticketId: string;
  adminId: string;
  body: string;
}) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: params.ticketId } });
  if (!ticket) return null;

  const message = await prisma.ticketMessage.create({
    data: { ticketId: params.ticketId, authorId: params.adminId, body: params.body },
  });

  await prisma.supportTicket.update({
    where: { id: params.ticketId },
    data: { status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status },
  });

  await notify({
    userId: ticket.authorId,
    type: "SUPPORT_TICKET_REPLY",
    title: `Risposta al ticket: ${ticket.subject}`,
    body: params.body.slice(0, 140),
    resourceType: "ticket",
    resourceId: ticket.id,
  });

  return message;
}
