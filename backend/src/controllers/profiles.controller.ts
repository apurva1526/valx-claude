import { Response } from "express";
import { Prisma, ProfileType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";

export async function getMyProfiles(req: AuthedRequest, res: Response) {
  const userId = req.user!.userId;

  const [user, ownedProfiles, teamMemberships] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.teamMember.findMany({ where: { userId }, include: { profile: true }, orderBy: { createdAt: "asc" } }),
  ]);

  const profiles = [
    ...ownedProfiles.map((p) => ({ ...p, access: "OWNER" as const, scopeGroupId: null })),
    ...teamMemberships.map((tm) => ({ ...tm.profile, access: tm.accessLevel, scopeGroupId: tm.scopeGroupId })),
  ];

  res.status(200).json({ profiles, name: user?.name ?? null });
}

export async function createProfile(req: AuthedRequest, res: Response) {
  const { name, companyName, profileType, gstNumber } = req.body ?? {};

  if (typeof companyName !== "string" || companyName.trim().length === 0) {
    return res.status(400).json({ error: "companyName is required" });
  }
  if (profileType !== "BUYER" && profileType !== "SUPPLIER") {
    return res.status(400).json({ error: "profileType must be BUYER or SUPPLIER" });
  }

  const { userId, phoneNumber } = req.user!;

  if (typeof name === "string" && name.trim().length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });
  }

  try {
    const profile = await prisma.profile.create({
      data: {
        userId,
        phoneNumber,
        companyName: companyName.trim(),
        profileType: profileType as ProfileType,
        gstNumber: typeof gstNumber === "string" && gstNumber.trim().length > 0 ? gstNumber.trim() : null,
      },
    });

    if (profile.profileType === "SUPPLIER") {
      // First Supplier profile under a phone number claims any pending group invites for it.
      await prisma.groupSupplier.updateMany({
        where: { phoneNumber, supplierProfileId: null },
        data: { supplierProfileId: profile.id },
      });
    }

    res.status(201).json({ profile });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "A profile with this company name and type already exists for this phone number" });
    }
    throw err;
  }
}
