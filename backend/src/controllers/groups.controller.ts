import { Response } from "express";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";

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

  const groups =
    profileType === "BUYER"
      ? await prisma.group.findMany({
          where: { buyerProfileId: profileId },
          include: { _count: { select: { suppliers: true } } },
          orderBy: { createdAt: "desc" },
        })
      : await prisma.group.findMany({
          where: { suppliers: { some: { supplierProfileId: profileId } } },
          include: { buyerProfile: { select: { companyName: true } } },
          orderBy: { createdAt: "desc" },
        });

  res.status(200).json({ groups });
}

export async function getGroupDetail(req: ProfileScopedRequest, res: Response) {
  const { id: profileId, profileType } = req.profile!;
  const { id: groupId } = req.params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      buyerProfile: { select: { companyName: true } },
      suppliers: true,
    },
  });

  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }

  if (profileType === "BUYER") {
    if (group.buyerProfileId !== profileId) {
      return res.status(403).json({ error: "Not your group" });
    }
    return res.status(200).json({ group });
  }

  const membership = group.suppliers.find((s) => s.supplierProfileId === profileId);
  if (!membership) {
    return res.status(403).json({ error: "You are not a member of this group" });
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

export async function addSuppliers(req: ProfileScopedRequest, res: Response) {
  const { id: profileId, profileType } = req.profile!;
  const { id: groupId } = req.params;
  const { contacts } = req.body ?? {};

  if (!Array.isArray(contacts) || contacts.length === 0) {
    return res.status(400).json({ error: "contacts must be a non-empty array" });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return res.status(404).json({ error: "Group not found" });
  }
  if (profileType !== "BUYER" || group.buyerProfileId !== profileId) {
    return res.status(403).json({ error: "Only the owning Buyer can add suppliers to this group" });
  }

  const results = [];
  for (const contact of contacts) {
    const phoneNumber = typeof contact?.phoneNumber === "string" ? contact.phoneNumber.trim() : "";
    const name = typeof contact?.name === "string" ? contact.name.trim() : null;
    if (!phoneNumber) continue;

    const existingSupplierProfile = await prisma.profile.findFirst({
      where: { phoneNumber, profileType: "SUPPLIER" },
      orderBy: { createdAt: "asc" },
    });

    const groupSupplier = await prisma.groupSupplier.upsert({
      where: { groupId_phoneNumber: { groupId, phoneNumber } },
      update: {},
      create: {
        groupId,
        phoneNumber,
        contactName: name,
        supplierProfileId: existingSupplierProfile?.id ?? null,
      },
    });
    results.push(groupSupplier);
  }

  res.status(201).json({ suppliers: results });
}
