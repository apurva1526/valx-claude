import { NotificationType, Prisma } from "@prisma/client";

type PrismaTx = Prisma.TransactionClient;

export async function notifyGroupSuppliers(
  tx: PrismaTx,
  groupId: string,
  type: NotificationType,
  message: string,
  bidId: string
): Promise<void> {
  const recipients = await tx.groupSupplier.findMany({
    where: { groupId, supplierProfileId: { not: null } },
    select: { supplierProfileId: true },
  });

  if (recipients.length === 0) return;

  await tx.notification.createMany({
    data: recipients.map((r) => ({
      recipientProfileId: r.supplierProfileId as string,
      type,
      message,
      bidId,
    })),
  });
}

export async function notifyRecipients(
  tx: PrismaTx,
  type: NotificationType,
  bidId: string,
  recipients: { recipientProfileId: string; message: string }[]
): Promise<void> {
  if (recipients.length === 0) return;

  await tx.notification.createMany({
    data: recipients.map((r) => ({
      recipientProfileId: r.recipientProfileId,
      type,
      message: r.message,
      bidId,
    })),
  });
}
