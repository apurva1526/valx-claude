import { NextFunction, Response } from "express";
import { ProfileType } from "@prisma/client";
import { AuthedRequest } from "./auth";
import { EffectiveAccessLevel, resolveProfileAccess } from "../lib/profileAccess";

export type { EffectiveAccessLevel };

export interface ProfileScopedRequest extends AuthedRequest {
  profile?: { id: string; profileType: ProfileType; companyName: string; phoneNumber: string };
  access?: { level: EffectiveAccessLevel; scopeGroupId: string | null };
}

export async function requireActiveProfile(req: ProfileScopedRequest, res: Response, next: NextFunction) {
  const profileId = req.headers["x-profile-id"];

  if (typeof profileId !== "string" || profileId.length === 0) {
    return res.status(400).json({ error: "Missing X-Profile-Id header" });
  }

  const resolved = await resolveProfileAccess(profileId, req.user!.userId);
  if (!resolved) {
    return res.status(403).json({ error: "Profile does not belong to the authenticated user" });
  }

  req.profile = {
    id: resolved.profile.id,
    profileType: resolved.profile.profileType,
    companyName: resolved.profile.companyName,
    phoneNumber: resolved.profile.phoneNumber,
  };
  req.access = { level: resolved.level, scopeGroupId: resolved.scopeGroupId };
  next();
}
