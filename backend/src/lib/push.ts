import { Expo, ExpoPushMessage } from "expo-server-sdk";
import { prisma } from "./prisma";
import { NotifiedRecipient } from "./notifications";

const expo = new Expo();

export async function sendPushToProfiles(
  profileIds: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (profileIds.length === 0) return;

  const tokens = await prisma.pushToken.findMany({
    where: { profileId: { in: profileIds } },
    select: { token: true },
  });
  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens
    .filter((t) => Expo.isExpoPushToken(t.token))
    .map((t) => ({ to: t.token, sound: "default", title, body, data }));
  if (messages.length === 0) return;

  const chunks = expo.chunkPushNotifications(messages);
  for (const chunk of chunks) {
    await expo.sendPushNotificationsAsync(chunk);
  }
}

// Recipients often share an identical message (e.g. "New bid posted") — group them so we
// send one batched push per distinct message instead of one call per recipient.
export async function sendPushForNotifications(
  recipients: NotifiedRecipient[],
  data?: Record<string, unknown>
): Promise<void> {
  const byMessage = new Map<string, string[]>();
  for (const r of recipients) {
    const ids = byMessage.get(r.message) ?? [];
    ids.push(r.recipientProfileId);
    byMessage.set(r.message, ids);
  }

  for (const [message, profileIds] of byMessage) {
    await sendPushToProfiles(profileIds, "ValX", message, data);
  }
}
