import { Response } from "express";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { getGroupForProfile } from "../lib/groupAccess";
import { getChatFirestore } from "../lib/firebase";
import { buildChatMaskingContext, maskMessage, RawChatMessage } from "../lib/chatLabels";
import { broadcastToBid } from "../ws/chatServer";
import { assertGroupInScope } from "../middleware/requirePermission";
import { notifyOrTouchBidGroup } from "../lib/notifications";
import { sendPushForNotifications } from "../lib/push";

async function loadBidAndCheckMembership(req: ProfileScopedRequest, bidId: string) {
  const bid = await prisma.bid.findUnique({ where: { id: bidId } });
  if (!bid) return { bid: null, isMember: false };
  const { isMember } = await getGroupForProfile(bid.groupId, req.profile!);
  return { bid, isMember: isMember && assertGroupInScope(req, bid.groupId) };
}

export async function getChatHistory(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;

  const { bid, isMember } = await loadBidAndCheckMembership(req, bidId);
  if (!bid) return res.status(404).json({ error: "Bid not found" });
  if (!isMember) return res.status(403).json({ error: "You are not a member of this bid's group" });

  await prisma.notification.updateMany({
    where: { recipientProfileId: req.profile!.id, bidId, type: "NEW_CHAT_MESSAGE", readAt: null },
    data: { readAt: new Date() },
  });

  const snapshot = await getChatFirestore()
    .collection("bidChats")
    .doc(bidId)
    .collection("messages")
    .orderBy("createdAt", "asc")
    .get();

  const raw: RawChatMessage[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      senderProfileId: data.senderProfileId ?? null,
      text: data.text,
      type: data.type,
      createdAt: data.createdAt?.toMillis() ?? Date.now(),
    };
  });

  const ctx = await buildChatMaskingContext(bid.groupId);
  const isBuyer = req.profile!.profileType === "BUYER";
  const messages = raw.map((m) => maskMessage(m, req.profile!.id, isBuyer, ctx));

  res.status(200).json({ messages });
}

export async function postChatMessage(req: ProfileScopedRequest, res: Response) {
  const { id: bidId } = req.params;
  const { text } = req.body ?? {};

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "text is required" });
  }

  const { bid, isMember } = await loadBidAndCheckMembership(req, bidId);
  if (!bid) return res.status(404).json({ error: "Bid not found" });
  if (!isMember) return res.status(403).json({ error: "You are not a member of this bid's group" });

  const firestore = getChatFirestore();
  const docRef = await firestore
    .collection("bidChats")
    .doc(bidId)
    .collection("messages")
    .add({
      senderProfileId: req.profile!.id,
      text: text.trim(),
      type: "text",
      createdAt: new Date(),
    });

  const raw: RawChatMessage = {
    id: docRef.id,
    senderProfileId: req.profile!.id,
    text: text.trim(),
    type: "text",
    createdAt: Date.now(),
  };

  const ctx = await buildChatMaskingContext(bid.groupId);
  broadcastToBid(bidId, (conn) => maskMessage(raw, conn.profileId, conn.profileType === "BUYER", ctx));

  const notified = await notifyOrTouchBidGroup(
    prisma,
    bidId,
    bid.groupId,
    req.profile!.id,
    "NEW_CHAT_MESSAGE",
    `New message in "${bid.title}"`
  );
  sendPushForNotifications(notified, { bidId, groupId: bid.groupId }).catch(() => {});

  const messageForSender = maskMessage(raw, req.profile!.id, req.profile!.profileType === "BUYER", ctx);
  res.status(201).json({ message: messageForSender });
}
