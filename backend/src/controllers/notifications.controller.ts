import { Response } from "express";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";

export async function getMyNotifications(req: ProfileScopedRequest, res: Response) {
  const notifications = await prisma.notification.findMany({
    where: { recipientProfileId: req.profile!.id },
    orderBy: { createdAt: "desc" },
    include: { bid: { select: { title: true, groupId: true } } },
  });

  res.status(200).json({ notifications });
}

export async function markAllNotificationsRead(req: ProfileScopedRequest, res: Response) {
  await prisma.notification.updateMany({
    where: { recipientProfileId: req.profile!.id, readAt: null },
    data: { readAt: new Date() },
  });

  res.status(204).send();
}

export async function markNotificationRead(req: ProfileScopedRequest, res: Response) {
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification) {
    return res.status(404).json({ error: "Notification not found" });
  }
  if (notification.recipientProfileId !== req.profile!.id) {
    return res.status(403).json({ error: "Not your notification" });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: { readAt: notification.readAt ?? new Date() },
  });

  res.status(200).json({ notification: updated });
}
