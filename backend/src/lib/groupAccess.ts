import { Group, GroupSupplier, ProfileType } from "@prisma/client";
import { prisma } from "./prisma";

type GroupWithSuppliers = Group & {
  suppliers: GroupSupplier[];
  buyerProfile: { companyName: string };
};

export async function getGroupForProfile(
  groupId: string,
  profile: { id: string; profileType: ProfileType }
): Promise<{ group: GroupWithSuppliers | null; isMember: boolean }> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { suppliers: true, buyerProfile: { select: { companyName: true } } },
  });

  if (!group) {
    return { group: null, isMember: false };
  }

  const isMember =
    profile.profileType === "BUYER"
      ? group.buyerProfileId === profile.id
      : group.suppliers.some((s) => s.supplierProfileId === profile.id);

  return { group, isMember };
}
