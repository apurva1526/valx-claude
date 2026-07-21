import { NextFunction, Response } from "express";
import { AccessLevel } from "@prisma/client";
import { ProfileScopedRequest } from "./activeProfile";

const LEVEL_RANK: Record<AccessLevel, number> = { VIEW: 0, EDIT: 1, MANAGE: 2 };

export function requireAccessLevel(min: AccessLevel) {
  return (req: ProfileScopedRequest, res: Response, next: NextFunction) => {
    const access = req.access!;
    if (access.level === "OWNER" || LEVEL_RANK[access.level] >= LEVEL_RANK[min]) {
      return next();
    }
    res.status(403).json({ error: `Requires ${min} access` });
  };
}

export function assertGroupInScope(req: ProfileScopedRequest, groupId: string): boolean {
  const access = req.access!;
  if (access.level === "OWNER" || access.scopeGroupId === null) return true;
  return access.scopeGroupId === groupId;
}
