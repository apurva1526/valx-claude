import { Response } from "express";
import { Currency } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { getGroupForProfile } from "../lib/groupAccess";

export async function createBid(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;
  const { title, description, validityDeadline, targetPrice, targetPriceCurrency } = req.body ?? {};

  if (req.profile!.profileType !== "BUYER") {
    return res.status(403).json({ error: "Only Buyer profiles can create bids" });
  }

  const { group, isMember } = await getGroupForProfile(groupId, req.profile!);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (!isMember) {
    return res.status(403).json({ error: "Not your group" });
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return res.status(400).json({ error: "title is required" });
  }
  if (typeof description !== "string" || description.trim().length === 0) {
    return res.status(400).json({ error: "description is required" });
  }
  const deadline = new Date(validityDeadline);
  if (isNaN(deadline.getTime()) || deadline.getTime() <= Date.now()) {
    return res.status(400).json({ error: "validityDeadline must be a valid date in the future" });
  }
  let parsedTargetPrice: number | null = null;
  if (targetPrice !== undefined && targetPrice !== null && targetPrice !== "") {
    parsedTargetPrice = Number(targetPrice);
    if (isNaN(parsedTargetPrice) || parsedTargetPrice <= 0) {
      return res.status(400).json({ error: "targetPrice must be a positive number" });
    }
  }
  if (targetPriceCurrency !== undefined && targetPriceCurrency !== "INR" && targetPriceCurrency !== "USD") {
    return res.status(400).json({ error: "targetPriceCurrency must be INR or USD" });
  }

  const bid = await prisma.bid.create({
    data: {
      groupId,
      title: title.trim(),
      description: description.trim(),
      validityDeadline: deadline,
      targetPrice: parsedTargetPrice,
      targetPriceCurrency: (targetPriceCurrency as Currency) ?? "INR",
      createdByProfileId: req.profile!.id,
    },
  });

  res.status(201).json({ bid });
}

export async function getGroupBids(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;

  const { group, isMember } = await getGroupForProfile(groupId, req.profile!);
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (!isMember) {
    return res.status(403).json({ error: "You are not a member of this group" });
  }

  const bids = await prisma.bid.findMany({
    where: { groupId },
    orderBy: { createdAt: "desc" },
  });

  res.status(200).json({ bids });
}

export async function getBidDetail(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;

  const bid = await prisma.bid.findUnique({
    where: { id: bidId },
    include: { createdByProfile: { select: { companyName: true } } },
  });
  if (!bid) {
    return res.status(404).json({ error: "Bid not found" });
  }

  const { isMember } = await getGroupForProfile(bid.groupId, req.profile!);
  if (!isMember) {
    return res.status(403).json({ error: "You are not a member of this bid's group" });
  }

  res.status(200).json({ bid });
}
