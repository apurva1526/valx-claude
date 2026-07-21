import { get, post } from "./client";

export type NotificationType = "BID_EDITED" | "BID_CREATED" | "BID_CLOSED" | "BID_DEADLINE_APPROACHING";

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  bidId: string | null;
  bid?: { title: string; groupId: string } | null;
  createdAt: string;
  readAt: string | null;
}

interface Auth {
  token: string;
  profileId: string;
}

export function getNotifications(auth: Auth): Promise<{ notifications: Notification[] }> {
  return get("/notifications", auth);
}

export function markNotificationRead(auth: Auth, id: string): Promise<{ notification: Notification }> {
  return post(`/notifications/${id}/read`, {}, auth);
}
