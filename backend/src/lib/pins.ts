import { PinType } from "@prisma/client";
import { prisma } from "./prisma";

export async function getPinnedIds(profileId: string, type: PinType): Promise<Set<string>> {
  const pins = await prisma.pin.findMany({ where: { profileId, type }, select: { targetId: true } });
  return new Set(pins.map((p) => p.targetId));
}

export function sortPinnedFirst<T extends { id: string }>(items: T[], pinnedIds: Set<string>): (T & { isPinned: boolean })[] {
  const withFlag = items.map((item) => ({ ...item, isPinned: pinnedIds.has(item.id) }));
  return [...withFlag.filter((i) => i.isPinned), ...withFlag.filter((i) => !i.isPinned)];
}
