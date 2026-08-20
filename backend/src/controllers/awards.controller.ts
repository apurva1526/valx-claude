import { Response } from "express";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { notifyRecipients } from "../lib/notifications";
import { sendPushForNotifications } from "../lib/push";
import { assertGroupInScope } from "../middleware/requirePermission";

export async function closeBid(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;
  const { awards } = req.body ?? {};

  if (req.profile!.profileType !== "BUYER") {
    return res.status(403).json({ error: "Only Buyer profiles can close bids" });
  }

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }
  if (bid.createdByProfileId !== req.profile!.id || !assertGroupInScope(req, bid.groupId)) {
    return res.status(403).json({ error: "Not your bid" });
  }

  const requestedAwards: { supplierProfileId: string; comment?: string }[] = Array.isArray(awards) ? awards : [];
  const requestedAwardIds = requestedAwards.map((a) => a.supplierProfileId);
  const commentBySupplierId = new Map(
    requestedAwards
      .filter((a) => typeof a.comment === "string" && a.comment.trim().length > 0)
      .map((a) => [a.supplierProfileId, a.comment!.trim()])
  );

  const responses = await prisma.bidResponse.findMany({
    where: { bidId },
    include: { supplierProfile: { select: { companyName: true } } },
  });
  const responseBySupplierId = new Map(responses.map((r) => [r.supplierProfileId, r]));

  for (const id of requestedAwardIds) {
    const response = responseBySupplierId.get(id);
    if (!response) {
      return res.status(400).json({ error: `Supplier ${id} has not responded to this bid` });
    }
    if (response.revokedAt) {
      return res.status(400).json({ error: `Supplier ${id} revoked their bid and can't be awarded` });
    }
  }

  const awardedResponses = requestedAwardIds.map((id) => responseBySupplierId.get(id)!);
  const averagePrice =
    awardedResponses.length > 0
      ? awardedResponses.reduce((sum, r) => sum + r.price, 0) / awardedResponses.length
      : null;

  try {
    const { award, notified } = await prisma.$transaction(async (tx) => {
      const result = await tx.bid.updateMany({
        where: { id: bidId, status: "ONGOING" },
        data: { status: "CLOSED" },
      });
      if (result.count === 0) {
        throw new Error("ALREADY_CLOSED");
      }

      const created = await tx.awardRecord.create({
        data: {
          bidId,
          awardedSupplierIds: requestedAwardIds,
          supplierComments: commentBySupplierId.size > 0 ? Object.fromEntries(commentBySupplierId) : undefined,
          averagePrice,
          closedByProfileId: req.profile!.id,
        },
      });

      const groupMembers = await tx.groupSupplier.findMany({
        where: { groupId: bid.groupId, supplierProfileId: { not: null } },
        select: { supplierProfileId: true },
      });
      const recipients = groupMembers.map((m) => {
        const supplierId = m.supplierProfileId as string;
        if (!requestedAwardIds.includes(supplierId)) {
          return { recipientProfileId: supplierId, message: `"${bid.title}" has closed` };
        }
        const comment = commentBySupplierId.get(supplierId);
        return {
          recipientProfileId: supplierId,
          message: `Congratulations! You were awarded on "${bid.title}"${comment ? ` — "${comment}"` : ""}`,
        };
      });
      const notified = await notifyRecipients(tx, "BID_CLOSED", bidId, recipients);

      return { award: created, notified };
    });

    sendPushForNotifications(notified, { bidId, groupId: bid.groupId }).catch(() => {});

    res.status(200).json({ award });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_CLOSED") {
      return res.status(409).json({ error: "This bid is already closed" });
    }
    throw err;
  }
}
