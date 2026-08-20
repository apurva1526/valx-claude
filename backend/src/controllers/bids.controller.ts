import { Response } from "express";
import { Currency } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { getGroupForProfile } from "../lib/groupAccess";
import { notifyGroupSuppliers } from "../lib/notifications";
import { sendPushForNotifications } from "../lib/push";
import { getChatFirestore } from "../lib/firebase";
import { assertGroupInScope } from "../middleware/requirePermission";
import { getPinnedIds, sortPinnedFirst } from "../lib/pins";

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

  const { bid, notified } = await prisma.$transaction(async (tx) => {
    const created = await tx.bid.create({
      data: {
        groupId,
        ...fields,
        createdByProfileId: req.profile!.id,
      },
    });

    const notified = await notifyGroupSuppliers(
      tx,
      groupId,
      "BID_CREATED",
      `New bid "${created.title}" posted in ${group!.name}`,
      created.id
    );

    return { bid: created, notified };
  });

  sendPushForNotifications(notified, { bidId: bid.id, groupId }).catch(() => {});

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

  const { bid, notified } = await prisma.$transaction(async (tx) => {
    const updated = await tx.bid.update({ where: { id: bidId }, data: fields });

    const notified = await notifyGroupSuppliers(
      tx,
      existingBid.groupId,
      "BID_EDITED",
      `"${updated.title}" was updated by ${req.profile!.companyName}`,
      updated.id
    );

    return { bid: updated, notified };
  });

  sendPushForNotifications(notified, { bidId: bid.id, groupId: existingBid.groupId }).catch(() => {});

  res.status(200).json({ bid });
}

export async function getOngoingBids(req: ProfileScopedRequest, res: Response) {
  const { id: profileId, profileType } = req.profile!;
  const { scopeGroupId } = req.access!;

  const groupWhere =
    profileType === "BUYER"
      ? { buyerProfileId: profileId }
      : { suppliers: { some: { supplierProfileId: profileId } } };

  const bids = await prisma.bid.findMany({
    where: {
      status: "ONGOING",
      group: groupWhere,
      ...(scopeGroupId ? { groupId: scopeGroupId } : {}),
    },
    include: { group: { select: { name: true } } },
    orderBy: { validityDeadline: "asc" },
  });

  res.status(200).json({
    bids: bids.map((b) => {
      const { group, ...bid } = b;
      return { ...bid, groupName: group.name };
    }),
  });
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

  const pinnedIds = await getPinnedIds(req.profile!.id, "BID");
  res.status(200).json({ bids: sortPinnedFirst(bids, pinnedIds) });
}

export async function pinBid(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }
  const { isMember } = await getGroupForProfile(bid.groupId, req.profile!);
  if (!isMember || !assertGroupInScope(req, bid.groupId)) {
    return res.status(403).json({ error: "You are not a member of this bid's group" });
  }

  await prisma.pin.upsert({
    where: { profileId_type_targetId: { profileId: req.profile!.id, type: "BID", targetId: bidId } },
    update: {},
    create: { profileId: req.profile!.id, type: "BID", targetId: bidId },
  });
  res.status(204).send();
}

export async function unpinBid(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;
  await prisma.pin.deleteMany({ where: { profileId: req.profile!.id, type: "BID", targetId: bidId } });
  res.status(204).send();
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

  const unreadChat = await prisma.notification.findFirst({
    where: { recipientProfileId: req.profile!.id, bidId, type: "NEW_CHAT_MESSAGE", readAt: null },
  });
  const hasUnreadChat = !!unreadChat;

  if (req.profile!.profileType === "BUYER" || !bid.awardRecord) {
    return res.status(200).json({ bid: { ...bid, hasUnreadChat } });
  }

  const { awardRecord, ...bidWithoutAward } = bid;
  const supplierComments = (awardRecord.supplierComments as Record<string, string> | null) ?? null;
  res.status(200).json({
    bid: {
      ...bidWithoutAward,
      hasUnreadChat,
      awardOutcome: {
        wasAwarded: awardRecord.awardedSupplierIds.includes(req.profile!.id),
        comment: supplierComments?.[req.profile!.id] ?? null,
      },
    },
  });
}
