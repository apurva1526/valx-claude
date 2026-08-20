import { prisma } from "../lib/prisma";
import { notifyRecipients } from "../lib/notifications";
import { sendPushForNotifications } from "../lib/push";

const CHECK_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const DEADLINE_WINDOW_MS = 2 * 60 * 60 * 1000; // 2 hours

async function runDeadlineAlertCheck(): Promise<void> {
  const now = new Date();
  const windowEnd = new Date(now.getTime() + DEADLINE_WINDOW_MS);

  const candidateBids = await prisma.bid.findMany({
    where: {
      status: "ONGOING",
      deadlineAlertSentAt: null,
      validityDeadline: { gte: now, lte: windowEnd },
    },
  });

  for (const bid of candidateBids) {
    const [members, responders] = await Promise.all([
      prisma.groupSupplier.findMany({
        where: { groupId: bid.groupId, supplierProfileId: { not: null } },
        select: { supplierProfileId: true },
      }),
      prisma.bidResponse.findMany({
        where: { bidId: bid.id },
        select: { supplierProfileId: true },
      }),
    ]);

    const respondedIds = new Set(responders.map((r) => r.supplierProfileId));
    const recipients = members
      .map((m) => m.supplierProfileId as string)
      .filter((id) => !respondedIds.has(id))
      .map((id) => ({
        recipientProfileId: id,
        message: `"${bid.title}" closes in under 2 hours and you haven't bid yet`,
      }));

    const notified = await prisma.$transaction(async (tx) => {
      const notified = await notifyRecipients(tx, "BID_DEADLINE_APPROACHING", bid.id, recipients);
      await tx.bid.update({ where: { id: bid.id }, data: { deadlineAlertSentAt: new Date() } });
      return notified;
    });

    sendPushForNotifications(notified, { bidId: bid.id, groupId: bid.groupId }).catch(() => {});
  }
}

export function startDeadlineAlertJob(): void {
  runDeadlineAlertCheck().catch((err) => console.error("Deadline alert check failed:", err));
  setInterval(() => {
    runDeadlineAlertCheck().catch((err) => console.error("Deadline alert check failed:", err));
  }, CHECK_INTERVAL_MS);
}
