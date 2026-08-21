import { Response } from "express";
import { AccessLevel } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { normalizePhoneNumber } from "../lib/phone";
import { getGroupForProfile } from "../lib/groupAccess";

const VALID_LEVELS: AccessLevel[] = ["VIEW", "EDIT", "MANAGE"];

async function validateScopeGroup(scopeGroupId: unknown, profileId: string, profileType: "BUYER" | "SUPPLIER") {
  if (scopeGroupId === undefined || scopeGroupId === null || scopeGroupId === "") return { scopeGroupId: null };
  if (typeof scopeGroupId !== "string") return { error: "scopeGroupId must be a string" };

  const { isMember } = await getGroupForProfile(scopeGroupId, { id: profileId, profileType });
  if (!isMember) return { error: "scopeGroupId must be a group this profile belongs to" };

  return { scopeGroupId };
}

export async function addTeamMember(req: ProfileScopedRequest, res: Response) {
  const { id: targetProfileId } = req.params;
  if (req.profile!.id !== targetProfileId) {
    return res.status(403).json({ error: "Profile mismatch" });
  }

  const { phoneNumber: rawPhoneNumber, name, accessLevel, scopeGroupId } = req.body ?? {};
  if (typeof rawPhoneNumber !== "string" || rawPhoneNumber.trim().length === 0) {
    return res.status(400).json({ error: "phoneNumber is required" });
  }
  const phoneNumber = normalizePhoneNumber(rawPhoneNumber);
  if (!phoneNumber) {
    return res.status(400).json({ error: "phoneNumber is invalid" });
  }
  if (phoneNumber === req.profile!.phoneNumber || phoneNumber === req.user!.phoneNumber) {
    return res.status(400).json({ error: "That's your own number — you can't add yourself as a team member" });
  }

  const level: AccessLevel = VALID_LEVELS.includes(accessLevel) ? accessLevel : "MANAGE";

  const scopeResult = await validateScopeGroup(scopeGroupId, targetProfileId, req.profile!.profileType);
  if ("error" in scopeResult) {
    return res.status(400).json({ error: scopeResult.error });
  }

  const existingUser = await prisma.user.findUnique({ where: { phoneNumber } });

  const teamMember = await prisma.teamMember.upsert({
    where: { profileId_phoneNumber: { profileId: targetProfileId, phoneNumber } },
    update: {
      accessLevel: level,
      scopeGroupId: scopeResult.scopeGroupId,
      contactName: typeof name === "string" && name.trim() ? name.trim() : undefined,
    },
    create: {
      profileId: targetProfileId,
      phoneNumber,
      contactName: typeof name === "string" && name.trim() ? name.trim() : null,
      accessLevel: level,
      scopeGroupId: scopeResult.scopeGroupId,
      userId: existingUser?.id ?? null,
    },
  });

  res.status(201).json({ teamMember });
}

export async function listTeamMembers(req: ProfileScopedRequest, res: Response) {
  const { id: targetProfileId } = req.params;
  if (req.profile!.id !== targetProfileId) {
    return res.status(403).json({ error: "Profile mismatch" });
  }

  const profile = await prisma.profile.findUnique({
    where: { id: targetProfileId },
    include: { user: { select: { name: true } } },
  });
  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  const viewerPhoneNumber = req.user!.phoneNumber;

  const teamMembers = await prisma.teamMember.findMany({
    where: { profileId: targetProfileId, phoneNumber: { not: viewerPhoneNumber } },
    include: { user: { select: { name: true, phoneNumber: true } } },
    orderBy: { createdAt: "asc" },
  });

  const owner =
    profile.phoneNumber !== viewerPhoneNumber ? { phoneNumber: profile.phoneNumber, name: profile.user.name } : null;

  res.status(200).json({ owner, teamMembers });
}

export async function updateTeamMember(req: ProfileScopedRequest, res: Response) {
  const { id: teamMemberId } = req.params;

  const teamMember = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
  if (!teamMember) {
    return res.status(404).json({ error: "Team member not found" });
  }
  if (teamMember.profileId !== req.profile!.id) {
    return res.status(403).json({ error: "Not your team member" });
  }

  const { accessLevel, scopeGroupId } = req.body ?? {};
  const data: { accessLevel?: AccessLevel; scopeGroupId?: string | null } = {};

  if (accessLevel !== undefined) {
    if (!VALID_LEVELS.includes(accessLevel)) {
      return res.status(400).json({ error: "accessLevel must be VIEW, EDIT, or MANAGE" });
    }
    data.accessLevel = accessLevel;
  }

  if (scopeGroupId !== undefined) {
    const scopeResult = await validateScopeGroup(scopeGroupId, teamMember.profileId, req.profile!.profileType);
    if ("error" in scopeResult) {
      return res.status(400).json({ error: scopeResult.error });
    }
    data.scopeGroupId = scopeResult.scopeGroupId;
  }

  const updated = await prisma.teamMember.update({ where: { id: teamMemberId }, data });
  res.status(200).json({ teamMember: updated });
}

export async function exitTeamMembership(req: ProfileScopedRequest, res: Response) {
  const { id: targetProfileId } = req.params;
  if (req.profile!.id !== targetProfileId) {
    return res.status(403).json({ error: "Profile mismatch" });
  }

  const membership = await prisma.teamMember.findFirst({
    where: { profileId: targetProfileId, userId: req.user!.userId },
  });
  if (!membership) {
    return res.status(404).json({ error: "You're not a team member of this profile" });
  }

  await prisma.teamMember.delete({ where: { id: membership.id } });
  res.status(204).send();
}

export async function removeTeamMember(req: ProfileScopedRequest, res: Response) {
  const { id: teamMemberId } = req.params;

  const teamMember = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
  if (!teamMember) {
    return res.status(404).json({ error: "Team member not found" });
  }
  if (teamMember.profileId !== req.profile!.id) {
    return res.status(403).json({ error: "Not your team member" });
  }

  await prisma.teamMember.delete({ where: { id: teamMemberId } });
  res.status(204).send();
}
