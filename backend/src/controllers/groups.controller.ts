import { Response } from "express";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { assertGroupInScope } from "../middleware/requirePermission";
import { getGroupForProfile } from "../lib/groupAccess";
import { normalizePhoneNumber } from "../lib/phone";
import { getPinnedIds, sortPinnedFirst } from "../lib/pins";
import { NotifiedRecipient, notifyRecipients } from "../lib/notifications";
import { sendPushForNotifications } from "../lib/push";

export async function createGroup(req: ProfileScopedRequest, res: Response) {
  if (req.profile!.profileType !== "BUYER") {
    return res.status(403).json({ error: "Only Buyer profiles can create groups" });
  }

  const { name, description } = req.body ?? {};
  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "name is required" });
  }

  const group = await prisma.group.create({
    data: {
      buyerProfileId: req.profile!.id,
      name: name.trim(),
      description: typeof description === "string" && description.trim().length > 0 ? description.trim() : null,
    },
  });

  res.status(201).json({ group });
}

export async function getMyGroups(req: ProfileScopedRequest, res: Response) {
  const { id: profileId, profileType } = req.profile!;
  const { scopeGroupId } = req.access!;

  const pinnedIds = await getPinnedIds(profileId, "GROUP");

  if (profileType === "BUYER") {
    const groups = await prisma.group.findMany({
      where: { buyerProfileId: profileId, ...(scopeGroupId ? { id: scopeGroupId } : {}) },
      include: { _count: { select: { suppliers: true } } },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ groups: sortPinnedFirst(groups, pinnedIds) });
  }

  const groups = await prisma.group.findMany({
    where: {
      suppliers: { some: { supplierProfileId: profileId } },
      ...(scopeGroupId ? { id: scopeGroupId } : {}),
    },
    include: { buyerProfile: { select: { companyName: true } } },
    orderBy: { createdAt: "desc" },
  });

  const unreadNotifications = await prisma.notification.findMany({
    where: { recipientProfileId: profileId, readAt: null, bidId: { not: null } },
    include: { bid: { select: { groupId: true } } },
  });
  const unreadGroupIds = new Set(
    unreadNotifications.map((n) => n.bid?.groupId).filter((id): id is string => !!id)
  );

  res.status(200).json({
    groups: sortPinnedFirst(
      groups.map((g) => ({ ...g, hasUnread: unreadGroupIds.has(g.id) })),
      pinnedIds
    ),
  });
}

export async function pinGroup(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;
  const { isMember } = await getGroupForProfile(groupId, req.profile!);
  if (!isMember || !assertGroupInScope(req, groupId)) {
    return res.status(403).json({ error: "You are not a member of this group" });
  }

  await prisma.pin.upsert({
    where: { profileId_type_targetId: { profileId: req.profile!.id, type: "GROUP", targetId: groupId } },
    update: {},
    create: { profileId: req.profile!.id, type: "GROUP", targetId: groupId },
  });
  res.status(204).send();
}

export async function unpinGroup(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;
  await prisma.pin.deleteMany({ where: { profileId: req.profile!.id, type: "GROUP", targetId: groupId } });
  res.status(204).send();
}

export async function getGroupDetail(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;
  const { group, isMember } = await getGroupForProfile(groupId, req.profile!);

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (!isMember || !assertGroupInScope(req, groupId)) {
    return res.status(403).json({ error: "You are not a member of this group" });
  }

  if (req.profile!.profileType === "BUYER") {
    return res.status(200).json({ group });
  }

  res.status(200).json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      imageUrl: group.imageUrl,
      createdAt: group.createdAt,
      buyerCompanyName: group.buyerProfile.companyName,
    },
  });
}

export async function getGroupMembers(req: ProfileScopedRequest, res: Response) {
  const { id: groupId } = req.params;
  const { group, isMember } = await getGroupForProfile(groupId, req.profile!);

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (!isMember || !assertGroupInScope(req, groupId)) {
    return res.status(403).json({ error: "You are not a member of this group" });
  }
  if (req.profile!.profileType !== "SUPPLIER") {
    return res.status(403).json({ error: "This view is for Supplier profiles" });
  }

  const buyerProfile = await prisma.profile.findUnique({
    where: { id: group.buyerProfileId },
    include: { user: { select: { name: true } } },
  });

  const [buyerTeamMembers, myTeamMembers] = await Promise.all([
    prisma.teamMember.findMany({
      where: { profileId: group.buyerProfileId, OR: [{ scopeGroupId: null }, { scopeGroupId: groupId }] },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.teamMember.findMany({
      where: { profileId: req.profile!.id, OR: [{ scopeGroupId: null }, { scopeGroupId: groupId }] },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const toMemberView = (tm: (typeof buyerTeamMembers)[number]) => ({
    name: tm.user?.name ?? tm.contactName ?? tm.phoneNumber,
    accessLevel: tm.accessLevel,
    pending: !tm.userId,
  });

  res.status(200).json({
    buyer: {
      companyName: buyerProfile?.companyName ?? group.buyerProfile.companyName,
      ownerName: buyerProfile?.user.name ?? null,
    },
    buyerTeamMembers: buyerTeamMembers.map(toMemberView),
    myTeamMembers: myTeamMembers.map(toMemberView),
  });
}

export async function addSuppliers(req: ProfileScopedRequest, res: Response) {
  const { id: profileId, profileType, phoneNumber: buyerPhoneNumber } = req.profile!;
  const actingUserPhoneNumber = req.user!.phoneNumber;
  const { id: groupId } = req.params;
  const { contacts } = req.body ?? {};

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: "contacts must be a non-empty array" });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (profileType !== "BUYER" || group.buyerProfileId !== profileId || !assertGroupInScope(req, groupId)) {
    return res.status(403).json({ error: "Only the owning Buyer can add suppliers to this group" });
  }

  // Normalize + dedupe the incoming contact list up front so every later query is batched
  // by phone number (one query for the whole request) instead of run once per contact.
  const skipped: { phoneNumber: string; reason: string }[] = [];
  const nameByPhone = new Map<string, string | null>();
  for (const contact of contacts) {
    const rawPhoneNumber = typeof contact?.phoneNumber === "string" ? contact.phoneNumber.trim() : "";
    const name = typeof contact?.name === "string" ? contact.name.trim() : null;
    if (!rawPhoneNumber) continue;
    const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
    if (!phoneNumber) continue;

    if (phoneNumber === buyerPhoneNumber || phoneNumber === actingUserPhoneNumber) {
      skipped.push({ phoneNumber, reason: "That's your own number — you can't add yourself as a supplier" });
      continue;
    }
    if (!nameByPhone.has(phoneNumber)) {
      nameByPhone.set(phoneNumber, name);
    }
  }

  const phoneNumbers = [...nameByPhone.keys()];
  if (phoneNumbers.length === 0) {
    return res.status(201).json({ suppliers: [], skipped });
  }

  const [existingSupplierProfiles, existingGroupSuppliers] = await Promise.all([
    prisma.profile.findMany({
      where: { phoneNumber: { in: phoneNumbers }, profileType: "SUPPLIER", deactivatedAt: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.groupSupplier.findMany({ where: { groupId, phoneNumber: { in: phoneNumbers } } }),
  ]);

  // Earliest-created SUPPLIER profile per phone number — a number can have more than one
  // over time, and the original per-contact lookup always picked the first ever created.
  const supplierProfileByPhone = new Map<string, (typeof existingSupplierProfiles)[number]>();
  for (const profile of existingSupplierProfiles) {
    if (!supplierProfileByPhone.has(profile.phoneNumber)) {
      supplierProfileByPhone.set(profile.phoneNumber, profile);
    }
  }
  const existingPhonesInGroup = new Set(existingGroupSuppliers.map((gs) => gs.phoneNumber));
  const phonesNeedingCreate = phoneNumbers.filter((p) => !existingPhonesInGroup.has(p));

  if (phonesNeedingCreate.length > 0) {
    await prisma.groupSupplier.createMany({
      data: phonesNeedingCreate.map((phoneNumber) => ({
        groupId,
        phoneNumber,
        contactName: nameByPhone.get(phoneNumber) ?? null,
        supplierProfileId: supplierProfileByPhone.get(phoneNumber)?.id ?? null,
      })),
      skipDuplicates: true,
    });
  }

  const results = await prisma.groupSupplier.findMany({ where: { groupId, phoneNumber: { in: phoneNumbers } } });

  const notified: NotifiedRecipient[] = phonesNeedingCreate
    .map((phoneNumber) => supplierProfileByPhone.get(phoneNumber))
    .filter((profile): profile is NonNullable<typeof profile> => !!profile)
    .map((profile) => ({ recipientProfileId: profile.id, message: `You were added to "${group.name}"` }));

  if (notified.length > 0) {
    await prisma.$transaction((tx) => notifyRecipients(tx, "ADDED_TO_GROUP", null, notified));
  }

  sendPushForNotifications(notified, { groupId }).catch(() => {});

  res.status(201).json({ suppliers: results, skipped });
}

export async function removeSupplierFromGroup(req: ProfileScopedRequest, res: Response) {
  const { id: profileId, profileType } = req.profile!;
  const { id: groupId, supplierId } = req.params;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (profileType !== "BUYER" || group.buyerProfileId !== profileId || !assertGroupInScope(req, groupId)) {
    return res.status(403).json({ error: "Only the owning Buyer can remove suppliers from this group" });
  }

  const groupSupplier = await prisma.groupSupplier.findUnique({ where: { id: supplierId } });
  if (!groupSupplier || groupSupplier.groupId !== groupId) {
    return res.status(404).json({ error: "Supplier not found in this group" });
  }

  await prisma.groupSupplier.delete({ where: { id: supplierId } });
  res.status(204).send();
}
