import { NextFunction, Response } from "express";
import { AccessLevel, ProfileType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "./auth";

export type EffectiveAccessLevel = "OWNER" | AccessLevel;

export interface ProfileScopedRequest extends AuthedRequest {
  profile?: { id: string; profileType: ProfileType; companyName: string };
  access?: { level: EffectiveAccessLevel; scopeGroupId: string | null };
}

export async function requireActiveProfile(req: ProfileScopedRequest, res: Response, next: NextFunction) {
  const profileId = req.headers["x-profile-id"];

  if (typeof profileId !== "string" || profileId.length === 0) {
    return res.status(400).json({ error: "Missing X-Profile-Id header" });
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile) {
    return res.status(403).json({ error: "Profile does not belong to the authenticated user" });
  }

  if (profile.userId === req.user!.userId) {
    req.profile = { id: profile.id, profileType: profile.profileType, companyName: profile.companyName };
    req.access = { level: "OWNER", scopeGroupId: null };
    return next();
  }

  const teamMember = await prisma.teamMember.findFirst({
    where: { profileId: profile.id, userId: req.user!.userId },
  });

  if (!teamMember) {
    return res.status(403).json({ error: "Profile does not belong to the authenticated user" });
  }

  req.profile = { id: profile.id, profileType: profile.profileType, companyName: profile.companyName };
  req.access = { level: teamMember.accessLevel, scopeGroupId: teamMember.scopeGroupId };
  next();
}
