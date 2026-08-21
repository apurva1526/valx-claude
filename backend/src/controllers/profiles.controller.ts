import { Response } from "express";
import { Prisma, ProfileType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AuthedRequest } from "../middleware/auth";
import { resolveProfileAccess } from "../lib/profileAccess";
import { ProfileScopedRequest } from "../middleware/activeProfile";
import { NotifiedRecipient, notifyRecipients } from "../lib/notifications";
import { sendPushForNotifications } from "../lib/push";

export async function getMyProfiles(req: AuthedRequest, res: Response) {
  const userId = req.user!.userId;

  const [user, ownedProfiles, teamMemberships, deactivatedProfiles] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.profile.findMany({ where: { userId, deactivatedAt: null }, orderBy: { createdAt: "asc" } }),
    prisma.teamMember.findMany({
      where: { userId, profile: { deactivatedAt: null } },
      include: { profile: true },
      orderBy: { createdAt: "asc" },
    }),
    // Owner-only — reactivation isn't available to team members, so we don't surface
    // deactivated profiles they merely had access to.
    prisma.profile.findMany({ where: { userId, deactivatedAt: { not: null } }, orderBy: { deactivatedAt: "desc" } }),
  ]);

  const profiles = [
    ...ownedProfiles.map((p) => ({ ...p, access: "OWNER" as const, scopeGroupId: null })),
    ...teamMemberships.map((tm) => ({ ...tm.profile, access: tm.accessLevel, scopeGroupId: tm.scopeGroupId })),
  ];

  res.status(200).json({ profiles, deactivatedProfiles, name: user?.name ?? null, phoneNumber: user?.phoneNumber ?? null });
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
      // Claims pending group invites (never resolved) plus any that were resolved to a
      // Supplier profile under this phone number that's since been deactivated.
      const staleProfileIds = (
        await prisma.profile.findMany({
          where: { phoneNumber, profileType: "SUPPLIER", deactivatedAt: { not: null }, NOT: { id: profile.id } },
          select: { id: true },
        })
      ).map((p) => p.id);

      await prisma.groupSupplier.updateMany({
        where: {
          phoneNumber,
          OR: [{ supplierProfileId: null }, { supplierProfileId: { in: staleProfileIds } }],
        },
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

export async function switchProfile(req: AuthedRequest, res: Response) {
  const { id } = req.params;

  const resolved = await resolveProfileAccess(id, req.user!.userId);
  if (!resolved) {
    return res.status(403).json({ error: "Profile does not belong to the authenticated user" });
  }

  res.status(200).json({
    profile: { ...resolved.profile, access: resolved.level, scopeGroupId: resolved.scopeGroupId },
  });
}

export async function updateProfile(req: ProfileScopedRequest, res: Response) {
  const { id: targetProfileId } = req.params;
  if (req.profile!.id !== targetProfileId) {
    return res.status(403).json({ error: "Profile mismatch" });
  }

  const { companyName, gstNumber } = req.body ?? {};
  const data: { companyName?: string; gstNumber?: string | null } = {};

  if (companyName !== undefined) {
    if (typeof companyName !== "string" || companyName.trim().length === 0) {
      return res.status(400).json({ error: "companyName cannot be empty" });
    }
    data.companyName = companyName.trim();
  }
  if (gstNumber !== undefined) {
    data.gstNumber = typeof gstNumber === "string" && gstNumber.trim().length > 0 ? gstNumber.trim() : null;
  }

  try {
    const profile = await prisma.profile.update({ where: { id: targetProfileId }, data });
    res.status(200).json({ profile });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return res.status(409).json({ error: "A profile with this company name and type already exists for this phone number" });
    }
    throw err;
  }
}

export async function deactivateProfile(req: ProfileScopedRequest, res: Response) {
  const { id: targetProfileId } = req.params;
  if (req.profile!.id !== targetProfileId) {
    return res.status(403).json({ error: "Profile mismatch" });
  }

  const existingProfile = await prisma.profile.findUnique({ where: { id: targetProfileId } });
  if (!existingProfile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  let bidsClosed = 0;
  let responsesWithdrawn = 0;
  const notified: NotifiedRecipient[] = [];

  const profile = await prisma.$transaction(async (tx) => {
    const updated = await tx.profile.update({ where: { id: targetProfileId }, data: { deactivatedAt: new Date() } });

    if (existingProfile.profileType === "BUYER") {
      const ongoingBids = await tx.bid.findMany({
        where: { createdByProfileId: targetProfileId, status: "ONGOING" },
        select: { id: true, groupId: true, title: true },
      });
      bidsClosed = ongoingBids.length;

      if (ongoingBids.length > 0) {
        await tx.bid.updateMany({
          where: { id: { in: ongoingBids.map((b) => b.id) } },
          data: { status: "CLOSED" },
        });

        // One query for every affected group's members instead of one per bid, then group
        // the results in memory — each bid still needs its own notifyRecipients call since
        // a Notification row carries a single bidId, but the expensive read is now batched.
        const distinctGroupIds = [...new Set(ongoingBids.map((b) => b.groupId))];
        const allGroupMembers = await tx.groupSupplier.findMany({
          where: { groupId: { in: distinctGroupIds }, supplierProfileId: { not: null } },
          select: { groupId: true, supplierProfileId: true },
        });
        const supplierIdsByGroupId = new Map<string, string[]>();
        for (const m of allGroupMembers) {
          const list = supplierIdsByGroupId.get(m.groupId) ?? [];
          list.push(m.supplierProfileId as string);
          supplierIdsByGroupId.set(m.groupId, list);
        }

        for (const bid of ongoingBids) {
          const supplierIds = supplierIdsByGroupId.get(bid.groupId) ?? [];
          notified.push(
            ...(await notifyRecipients(
              tx,
              "BID_CLOSED",
              bid.id,
              supplierIds.map((supplierProfileId) => ({
                recipientProfileId: supplierProfileId,
                message: `"${bid.title}" was closed because the buyer is no longer active`,
              }))
            ))
          );
        }
        // Note: we can't notify the buyer's own team via the Notification system here —
        // notifications are scoped to X-Profile-Id, and this profile is now deactivated,
        // so nobody could ever fetch it. bidsClosed is returned below instead so the
        // actor sees it immediately.
      }
    }

    if (existingProfile.profileType === "SUPPLIER") {
      const ongoingResponses = await tx.bidResponse.findMany({
        where: { supplierProfileId: targetProfileId, revokedAt: null, bid: { status: "ONGOING" } },
        include: { bid: { select: { id: true, title: true, createdByProfileId: true } } },
      });
      responsesWithdrawn = ongoingResponses.length;

      if (ongoingResponses.length > 0) {
        // Prisma's interactive transactions share one connection, so these can't safely run
        // via Promise.all — instead the two writes revokeResponseCore does per-response are
        // batched into one updateMany + one createMany across all of them. The history log
        // (BidResponseRevision) still always increments; the cap-counting revisionNumber on
        // BidResponse itself is left unchanged, matching revokeResponseCore's involuntary-revoke
        // behavior (deactivation shouldn't burn one of the supplier's 5 revisions).
        const now = new Date();
        await tx.bidResponse.updateMany({
          where: { id: { in: ongoingResponses.map((r) => r.id) } },
          data: { revokedAt: now },
        });
        await tx.bidResponseRevision.createMany({
          data: ongoingResponses.map((r) => ({
            bidResponseId: r.id,
            price: r.price,
            comment: r.comment,
            revisionNumber: r.revisionNumber + 1,
            revokedAt: now,
          })),
        });

        for (const response of ongoingResponses) {
          notified.push(
            ...(await notifyRecipients(tx, "BID_RESPONSE_SUBMITTED", response.bid.id, [
              {
                recipientProfileId: response.bid.createdByProfileId,
                message: `A supplier's bid on "${response.bid.title}" was withdrawn (profile deactivated)`,
              },
            ]))
          );
        }
      }

      const memberships = await tx.groupSupplier.findMany({
        where: { supplierProfileId: targetProfileId },
        include: { group: { select: { name: true, buyerProfileId: true } } },
      });
      notified.push(
        ...(await notifyRecipients(
          tx,
          "PROFILE_DEACTIVATED",
          null,
          memberships.map((membership) => ({
            recipientProfileId: membership.group.buyerProfileId,
            message: `A supplier in "${membership.group.name}" is no longer active`,
          }))
        ))
      );
      // GroupSupplier rows are intentionally left untouched so reactivation restores them.
    }

    return updated;
  });

  sendPushForNotifications(notified).catch(() => {});

  res.status(200).json({ profile, bidsClosed, responsesWithdrawn });
}

export async function registerPushToken(req: ProfileScopedRequest, res: Response) {
  const { id: targetProfileId } = req.params;
  if (req.profile!.id !== targetProfileId) {
    return res.status(403).json({ error: "Profile mismatch" });
  }

  const { token } = req.body ?? {};
  if (typeof token !== "string" || token.trim().length === 0) {
    return res.status(400).json({ error: "token is required" });
  }

  await prisma.pushToken.upsert({
    where: { profileId_token: { profileId: targetProfileId, token: token.trim() } },
    update: {},
    create: { profileId: targetProfileId, token: token.trim() },
  });

  res.status(204).send();
}

export async function reactivateProfile(req: AuthedRequest, res: Response) {
  const { id: targetProfileId } = req.params;

  const profile = await prisma.profile.findUnique({ where: { id: targetProfileId } });
  if (!profile || profile.userId !== req.user!.userId) {
    return res.status(403).json({ error: "Profile does not belong to the authenticated user" });
  }
  if (!profile.deactivatedAt) {
    return res.status(400).json({ error: "This profile is already active" });
  }

  const reactivated = await prisma.profile.update({
    where: { id: targetProfileId },
    data: { deactivatedAt: null },
  });

  if (profile.profileType === "SUPPLIER") {
    // Claim any group invites for this phone number that came in while deactivated
    // (they couldn't resolve to this profile at the time, same as a brand-new signup).
    await prisma.groupSupplier.updateMany({
      where: { phoneNumber: profile.phoneNumber, supplierProfileId: null },
      data: { supplierProfileId: profile.id },
    });
  }

  res.status(200).json({ profile: reactivated });
}
