import { NotificationType, Prisma } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

export interface NotifiedRecipient {
  recipientProfileId: string;
  message: string;
}

export async function notifyGroupSuppliers(
  tx: PrismaTx,
  groupId: string,
  type: NotificationType,
  message: string,
  bidId: string
): Promise<NotifiedRecipient[]> {
  const recipients = await tx.groupSupplier.findMany({
    where: { groupId, supplierProfileId: { not: null } },
    select: { supplierProfileId: true },
  });

  if (recipients.length === 0) return [];

  await tx.notification.createMany({
    data: recipients.map((r) => ({
      recipientProfileId: r.supplierProfileId as string,
      type,
      message,
      bidId,
    })),
  });

  return recipients.map((r) => ({ recipientProfileId: r.supplierProfileId as string, message }));
}

export async function notifyRecipients(
  tx: PrismaTx,
  type: NotificationType,
  bidId: string,
  recipients: NotifiedRecipient[]
): Promise<NotifiedRecipient[]> {
  if (recipients.length === 0) return [];

  await tx.notification.createMany({
    data: recipients.map((r) => ({
      recipientProfileId: r.recipientProfileId,
      type,
      message: r.message,
      bidId,
    })),
  });

  return recipients;
}

// Collapses repeated events (e.g. chat messages) into a single unread notification per
// recipient+bid instead of spamming one row per event, by bumping createdAt on the
// existing unread row instead of creating a duplicate.
export async function notifyOrTouchBidGroup(
  tx: PrismaTx,
  bidId: string,
  groupId: string,
  senderProfileId: string,
  type: NotificationType,
  message: string
): Promise<NotifiedRecipient[]> {
  const group = await tx.group.findUnique({
    where: { id: groupId },
    include: {
      suppliers: { where: { supplierProfileId: { not: null } }, select: { supplierProfileId: true } },
    },
  });
  if (!group) return [];

  const recipientIds = [group.buyerProfileId, ...group.suppliers.map((s) => s.supplierProfileId as string)].filter(
    (id) => id !== senderProfileId
  );

  for (const recipientProfileId of recipientIds) {
    const existingUnread = await tx.notification.findFirst({
      where: { recipientProfileId, bidId, type, readAt: null },
    });
    if (existingUnread) {
      await tx.notification.update({
        where: { id: existingUnread.id },
        data: { message, createdAt: new Date() },
      });
    } else {
      await tx.notification.create({
        data: { recipientProfileId, type, message, bidId },
      });
    }
  }

  return recipientIds.map((recipientProfileId) => ({ recipientProfileId, message }));
}
