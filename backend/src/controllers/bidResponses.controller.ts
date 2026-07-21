import { Response } from "express";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { getGroupForProfile } from "../lib/groupAccess";

const MAX_REVISIONS = 5;

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
  if (!isMember) {
    return res.status(403).json({ error: "You are not a member of this bid's group" });
  }
  if (bid.status !== "ONGOING") {
    return res.status(400).json({ error: "This bid is closed" });
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

  const nextRevisionNumber = existing ? existing.revisionNumber + 1 : 1;

  const response = await prisma.$transaction(async (tx) => {
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

    return saved;
  });

  res.status(existing ? 200 : 201).json({ response });
}

export async function getBidResponses(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;

  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }

  const { isMember } = await getGroupForProfile(bid.groupId, req.profile!);
  if (!isMember) {
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

    return res.status(200).json({
      responses: responses.map((r) => ({
        supplierProfileId: r.supplierProfileId,
        companyName: r.supplierProfile.companyName,
        price: r.price,
        comment: r.comment,
        revisionNumber: r.revisionNumber,
        updatedAt: r.updatedAt,
        history: r.revisions.map((rev) => ({
          price: rev.price,
          comment: rev.comment,
          revisionNumber: rev.revisionNumber,
          createdAt: rev.createdAt,
        })),
      })),
    });
  }

  const bestResponse = await prisma.bidResponse.findFirst({
    where: { bidId },
    orderBy: { price: "asc" },
  });

  const yours = await prisma.bidResponse.findUnique({
    where: { bidId_supplierProfileId: { bidId, supplierProfileId: req.profile!.id } },
    include: { revisions: { orderBy: { revisionNumber: "asc" } } },
  });

  res.status(200).json({
    bestPrice: bestResponse?.price ?? null,
    yourResponse: yours ? { price: yours.price, comment: yours.comment, revisionNumber: yours.revisionNumber } : null,
    yourHistory: yours
      ? yours.revisions.map((rev) => ({
          price: rev.price,
          comment: rev.comment,
          revisionNumber: rev.revisionNumber,
          createdAt: rev.createdAt,
        }))
      : [],
  });
}
