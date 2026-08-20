import { Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { getGroupForProfile } from "../lib/groupAccess";
import { assertGroupInScope } from "../middleware/requirePermission";
import { notifyRecipients } from "../lib/notifications";
import { sendPushForNotifications } from "../lib/push";

const MAX_REVISIONS = 5;

// Shared core used both by the supplier-initiated revoke route and by deactivateProfile's
// forced revoke of a deactivated supplier's ongoing responses (which bypasses the 5-revision cap).
export async function revokeResponseCore(
  tx: Prisma.TransactionClient,
  bidResponse: { id: string; price: number; comment: string | null; revisionNumber: number },
  bidId: string,
  buyerProfileId: string,
  message: string
) {
  const nextRevisionNumber = bidResponse.revisionNumber + 1;
  const now = new Date();

  const saved = await tx.bidResponse.update({
    where: { id: bidResponse.id },
    data: { revisionNumber: nextRevisionNumber, revokedAt: now },
  });

  await tx.bidResponseRevision.create({
    data: {
      bidResponseId: saved.id,
      price: saved.price,
      comment: saved.comment,
      revisionNumber: nextRevisionNumber,
      revokedAt: now,
    },
  });

  const notified = await notifyRecipients(tx, "BID_RESPONSE_SUBMITTED", bidId, [
    { recipientProfileId: buyerProfileId, message },
  ]);

  return { saved, notified };
}

export async function submitResponse(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;
  const { price, comment } = req.body ?? {};

  if (req.profile!.profileType !== "SUPPLIER") {
    return res.status(403).json({ error: "Only Supplier profiles can respond to bids" });
  }

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }

  const { isMember } = await getGroupForProfile(bid.groupId, req.profile!);
  if (!isMember || !assertGroupInScope(req, bid.groupId)) {
    return res.status(403).json({ error: "You are not a member of this bid's group" });
  }
  if (bid.status !== "ONGOING") {
    return res.status(400).json({ error: "This bid is closed" });
  }
  if (bid.validityDeadline.getTime() <= Date.now()) {
    return res.status(400).json({ error: "This bid's validity has expired" });
  }

  const parsedPrice = Number(price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
    return res.status(400).json({ error: "price must be a positive number" });
  }
  const trimmedComment = typeof comment === "string" && comment.trim().length > 0 ? comment.trim() : null;

  const existing = await prisma.bidResponse.findUnique({
    where: { bidId_supplierProfileId: { bidId, supplierProfileId: req.profile!.id } },
  });

  if (existing && existing.revisionNumber >= MAX_REVISIONS) {
    return res.status(400).json({ error: "Revision limit reached — your last price stands" });
  }
  if (existing && parsedPrice >= existing.price) {
    return res.status(400).json({ error: `Your revised price must be lower than your previous price (${existing.price})` });
  }

  const nextRevisionNumber = existing ? existing.revisionNumber + 1 : 1;

  const { response, notified } = await prisma.$transaction(async (tx) => {
    const saved = await tx.bidResponse.upsert({
      where: { bidId_supplierProfileId: { bidId, supplierProfileId: req.profile!.id } },
      create: {
        bidId,
        supplierProfileId: req.profile!.id,
        price: parsedPrice,
        comment: trimmedComment,
        revisionNumber: 1,
      },
      update: {
        price: parsedPrice,
        comment: trimmedComment,
        revisionNumber: nextRevisionNumber,
        revokedAt: null,
      },
    });

    await tx.bidResponseRevision.create({
      data: {
        bidResponseId: saved.id,
        price: parsedPrice,
        comment: trimmedComment,
        revisionNumber: nextRevisionNumber,
      },
    });

    const message = existing
      ? `${req.profile!.companyName} revised their bid on "${bid.title}"`
      : `New bid from ${req.profile!.companyName} on "${bid.title}"`;
    const notified = await notifyRecipients(tx, "BID_RESPONSE_SUBMITTED", bidId, [
      { recipientProfileId: bid.createdByProfileId, message },
    ]);

    return { response: saved, notified };
  });

  sendPushForNotifications(notified, { bidId, groupId: bid.groupId }).catch(() => {});

  res.status(existing ? 200 : 201).json({ response });
}

export async function revokeResponse(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;

  if (req.profile!.profileType !== "SUPPLIER") {
    return res.status(403).json({ error: "Only Supplier profiles can revoke a bid" });
  }

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }
  if (bid.status !== "ONGOING") {
    return res.status(400).json({ error: "This bid is closed" });
  }

  const existing = await prisma.bidResponse.findUnique({
    where: { bidId_supplierProfileId: { bidId, supplierProfileId: req.profile!.id } },
  });
  if (!existing) {
    return res.status(400).json({ error: "You haven't submitted a bid on this yet" });
  }
  if (existing.revokedAt) {
    return res.status(400).json({ error: "You've already revoked this bid" });
  }
  if (existing.revisionNumber >= MAX_REVISIONS) {
    return res.status(400).json({ error: "Revision limit reached — you can't revoke" });
  }

  const { saved: response, notified } = await prisma.$transaction(async (tx) =>
    revokeResponseCore(
      tx,
      existing,
      bidId,
      bid.createdByProfileId,
      `${req.profile!.companyName} revoked their bid on "${bid.title}"`
    )
  );

  sendPushForNotifications(notified, { bidId, groupId: bid.groupId }).catch(() => {});

  res.status(200).json({ response });
}

export async function getBidResponses(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }

  const { isMember } = await getGroupForProfile(bid.groupId, req.profile!);
  if (!isMember || !assertGroupInScope(req, bid.groupId)) {
    return res.status(403).json({ error: "You are not a member of this bid's group" });
  }

  if (req.profile!.profileType === "BUYER") {
    const responses = await prisma.bidResponse.findMany({
      where: { bidId },
      orderBy: { price: "asc" },
      include: {
        supplierProfile: { select: { companyName: true } },
        revisions: { orderBy: { revisionNumber: "asc" } },
      },
    });

    const active = responses.filter((r) => !r.revokedAt);
    const revoked = responses.filter((r) => r.revokedAt);

    return res.status(200).json({
      responses: [...active, ...revoked].map((r) => ({
        supplierProfileId: r.supplierProfileId,
        companyName: r.supplierProfile.companyName,
        price: r.price,
        comment: r.comment,
        revisionNumber: r.revisionNumber,
        revokedAt: r.revokedAt,
        updatedAt: r.updatedAt,
        history: r.revisions.map((rev) => ({
          price: rev.price,
          comment: rev.comment,
          revisionNumber: rev.revisionNumber,
          revokedAt: rev.revokedAt,
          createdAt: rev.createdAt,
        })),
      })),
    });
  }

  const bestResponse = await prisma.bidResponse.findFirst({
    where: { bidId, revokedAt: null },
    orderBy: { price: "asc" },
  });

  const yours = await prisma.bidResponse.findUnique({
    where: { bidId_supplierProfileId: { bidId, supplierProfileId: req.profile!.id } },
    include: { revisions: { orderBy: { revisionNumber: "asc" } } },
  });

  res.status(200).json({
    bestPrice: bestResponse?.price ?? null,
    yourResponse: yours
      ? { price: yours.price, comment: yours.comment, revisionNumber: yours.revisionNumber, revokedAt: yours.revokedAt }
      : null,
    yourHistory: yours
      ? yours.revisions.map((rev) => ({
          price: rev.price,
          comment: rev.comment,
          revisionNumber: rev.revisionNumber,
          revokedAt: rev.revokedAt,
          createdAt: rev.createdAt,
        }))
      : [],
  });
}
