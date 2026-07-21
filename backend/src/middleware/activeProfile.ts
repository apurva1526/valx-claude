import { NextFunction, Response } from "express";
import { ProfileType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "./auth";

export interface ProfileScopedRequest extends AuthedRequest {
  profile?: { id: string; profileType: ProfileType; companyName: string };
}

export async function requireActiveProfile(req: ProfileScopedRequest, res: Response, next: NextFunction) {
  const profileId = req.headers["x-profile-id"];

  if (typeof profileId !== "string" || profileId.length === 0) {
    return res.status(400).json({ error: "Missing X-Profile-Id header" });
  }

  const profile = await prisma.profile.findUnique({ where: { id: profileId } });

  if (!profile || profile.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Profile does not belong to the authenticated user" });
  }

  req.profile = { id: profile.id, profileType: profile.profileType, companyName: profile.companyName };
  next();
}
