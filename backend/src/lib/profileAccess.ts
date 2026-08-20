import { AccessLevel, Profile } from "@prisma/client";
import { prisma } from "./prisma";

export type EffectiveAccessLevel = "OWNER" | AccessLevel;

export interface ResolvedProfileAccess {
  profile: Profile;
  level: EffectiveAccessLevel;
  scopeGroupId: string | null;
}

export async function resolveProfileAccess(
  profileId: string,
  userId: string
): Promise<ResolvedProfileAccess | null> {
  const profile = await prisma.profile.findUnique({ where: { id: profileId } });
  if (!profile || profile.deactivatedAt) return null;

  if (profile.userId === userId) {
    return { profile, level: "OWNER", scopeGroupId: null };
  }

  const teamMember = await prisma.teamMember.findFirst({ where: { profileId, userId } });
  if (!teamMember) return null;

  return { profile, level: teamMember.accessLevel, scopeGroupId: teamMember.scopeGroupId };
}
