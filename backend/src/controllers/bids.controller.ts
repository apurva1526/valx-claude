import { Response } from "express";
import { Currency } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { getGroupForProfile } from "../lib/groupAccess";
import { notifyGroupSuppliers } from "../lib/notifications";
import { getChatFirestore } from "../lib/firebase";
import { assertGroupInScope } from "../middleware/requirePermission";

interface ValidatedBidFields {
  title: string;
  description: string;
  validityDeadline: Date;
  targetPrice: number | null;
  targetPriceCurrency: Currency;
}

function validateBidFields(body: any): ValidatedBidFields | { error: string } {
  const { title, description, validityDeadline, targetPrice, targetPriceCurrency } = body ?? {};

  if (typeof title !== "string" || title.trim().length === 0) {
    return { error: "title is required" };
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return { error: "description is required" };
  }
  const deadline = new Date(validityDeadline);
  if (isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    return { error: "validityDeadline must be a valid date in the future" };
  }
  let parsedTargetPrice: number | null = null;
  if (targetPrice !== undefined && targetPrice !== null && targetPrice !== "") {
    parsedTargetPrice = Number(targetPrice);
    if (isNaN(parsedTargetPrice) || parsedTargetPrice <= 0) {
      return { error: "targetPrice must be a positive number" };
    }
  }
  if (targetPriceCurrency !== undefined && targetPriceCurrency !== "INR" && targetPriceCurrency !== "USD") {
    return { error: "targetPriceCurrency must be INR or USD" };
  }

  return {
    title: title.trim(),
    description: description.trim(),
    validityDeadline: deadline,
    targetPrice: parsedTargetPrice,
    targetPriceCurrency: (targetPriceCurrency as Currency) ?? "INR",
  };
}

export async function createBid(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;

  if (req.profile!.profileType !== "BUYER") {
    return res.status(403).json({ error: "Only Buyer profiles can create bids" });
  }

  const { group, isMember } = await getGroupForProfile(groupId, req.profile!);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (!isMember || !assertGroupInScope(req, groupId)) {
    return res.status(403).json({ error: "Not your group" });
  }

  const fields = validateBidFields(req.body);
  if ("error" in fields) {
    return res.status(400).json({ error: fields.error });
  }

  const bid = await prisma.$transaction(async (tx) => {
    const created = await tx.bid.create({
      data: {
        groupId,
        ...fields,
        createdByProfileId: req.profile!.id,
      },
    });

    await notifyGroupSuppliers(
      tx,
      groupId,
      "BID_CREATED",
      `New bid "${created.title}" posted in ${group!.name}`,
      created.id
    );

    return created;
  });

  try {
    const priceLine = bid.targetPrice != null ? `\nTarget price: ${bid.targetPriceCurrency} ${bid.targetPrice}` : "";
    await getChatFirestore()
      .collection("bidChats")
      .doc(bid.id)
      .collection("messages")
      .add({
        senderProfileId: null,
        text: `${bid.title}\n${bid.description}${priceLine}\nValid till: ${bid.validityDeadline.toISOString()}`,
        type: "system",
        createdAt: new Date(),
      });
  } catch (err) {
    console.warn("Skipped chat bid-card seed (Firebase not configured yet):", (err as Error).message);
  }

  res.status(201).json({ bid });
}

export async function updateBid(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;

  if (req.profile!.profileType !== "BUYER") {
    return res.status(403).json({ error: "Only Buyer profiles can edit bids" });
  }

  const existingBid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!existingBid) {
    return res.status(404).json({ error: "Bid not found" });
  }

  const { isMember } = await getGroupForProfile(existingBid.groupId, req.profile!);
  if (!isMember || !assertGroupInScope(req, existingBid.groupId)) {
    return res.status(403).json({ error: "Not your bid" });
  }
  if (existingBid.status !== "ONGOING") {
    return res.status(400).json({ error: "This bid is closed" });
  }

  const fields = validateBidFields(req.body);
  if ("error" in fields) {
    return res.status(400).json({ error: fields.error });
  }

  const bid = await prisma.$transaction(async (tx) => {
    const updated = await tx.bid.update({ where: { id: bidId }, data: fields });

    await notifyGroupSuppliers(
      tx,
      existingBid.groupId,
      "BID_EDITED",
      `"${updated.title}" was updated by ${req.profile!.companyName}`,
      updated.id
    );

    return updated;
  });

  res.status(200).json({ bid });
}

export async function getGroupBids(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;

  const { group, isMember } = await getGroupForProfile(groupId, req.profile!);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (!isMember || !assertGroupInScope(req, groupId)) {
    return res.status(403).json({ error: "You are not a member of this group" });
  }

  const bids = await prisma.bid.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
  });

  if (req.profile!.profileType === "SUPPLIER") {
    await prisma.notification.updateMany({
      where: {
        recipientProfileId: req.profile!.id,
        readAt: null,
        bid: { groupId },
      },
      data: { readAt: new Date() },
    });
  }

  res.status(200).json({ bids });
}

export async function getBidDetail(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;

  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: {
      createdByProfile: { select: { companyName: true } },
      awardRecord: true,
    },
  });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }

  const { isMember } = await getGroupForProfile(bid.groupId, req.profile!);
  if (!isMember || !assertGroupInScope(req, bid.groupId)) {
    return res.status(403).json({ error: "You are not a member of this bid's group" });
  }

  if (req.profile!.profileType === "BUYER" || !bid.awardRecord) {
    return res.status(200).json({ bid });
  }

  const { awardRecord, ...bidWithoutAward } = bid;
  res.status(200).json({
    bid: {
      ...bidWithoutAward,
      awardOutcome: { wasAwarded: awardRecord.awardedSupplierIds.includes(req.profile!.id) },
    },
  });
}
