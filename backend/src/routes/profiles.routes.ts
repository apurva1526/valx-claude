import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createProfile, getMyProfiles, switchProfile } from "../controllers/profiles.controller";
import { addTeamMember, listTeamMembers } from "../controllers/teamMembers.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireActiveProfile } from "../middleware/activeProfile";
import { requireAccessLevel } from "../middleware/requirePermission";

export const profilesRouter = Router();

profilesRouter.use(requireAuth);
profilesRouter.get("/me", asyncHandler(getMyProfiles));
profilesRouter.post("/", asyncHandler(createProfile));
profilesRouter.post("/:id/switch", asyncHandler(switchProfile));
profilesRouter.post(
  "/:id/team-members",
  asyncHandler(requireActiveProfile),
  requireAccessLevel("MANAGE"),
  asyncHandler(addTeamMember)
);
profilesRouter.get(
  "/:id/team-members",
  asyncHandler(requireActiveProfile),
  requireAccessLevel("MANAGE"),
  asyncHandler(listTeamMembers)
);
