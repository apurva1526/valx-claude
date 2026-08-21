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
  bidId: string | null,
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
  if (recipientIds.length === 0) return [];

  // One read to find who already has an unread row to touch, then at most one batched
  // update and one batched create — instead of a findFirst + update-or-create per recipient.
  const existingUnread = await tx.notification.findMany({
    where: { recipientProfileId: { in: recipientIds }, bidId, type, readAt: null },
    select: { id: true, recipientProfileId: true },
  });
  const recipientIdsWithUnread = new Set(existingUnread.map((n) => n.recipientProfileId));
  const recipientIdsNeedingCreate = recipientIds.filter((id) => !recipientIdsWithUnread.has(id));

  if (existingUnread.length > 0) {
    await tx.notification.updateMany({
      where: { id: { in: existingUnread.map((n) => n.id) } },
      data: { message, createdAt: new Date() },
    });
  }
  if (recipientIdsNeedingCreate.length > 0) {
    await tx.notification.createMany({
      data: recipientIdsNeedingCreate.map((recipientProfileId) => ({ recipientProfileId, type, message, bidId })),
    });
  }

  return recipientIds.map((recipientProfileId) => ({ recipientProfileId, message }));
}
