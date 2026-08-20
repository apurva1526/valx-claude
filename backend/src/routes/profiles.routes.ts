import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createProfile,
  deactivateProfile,
  getMyProfiles,
  reactivateProfile,
  registerPushToken,
  switchProfile,
  updateProfile,
} from "../controllers/profiles.controller";
import { addTeamMember, exitTeamMembership, listTeamMembers } from "../controllers/teamMembers.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireActiveProfile } from "../middleware/activeProfile";
import { requireAccessLevel } from "../middleware/requirePermission";

export const profilesRouter = Router();

profilesRouter.use(requireAuth);
profilesRouter.get("/me", asyncHandler(getMyProfiles));
profilesRouter.post("/", asyncHandler(createProfile));
profilesRouter.post("/:id/switch", asyncHandler(switchProfile));
profilesRouter.post("/:id/reactivate", asyncHandler(reactivateProfile));
profilesRouter.patch(
  "/:id",
  asyncHandler(requireActiveProfile),
  requireAccessLevel("MANAGE"),
  asyncHandler(updateProfile)
);
profilesRouter.post("/:id/push-token", asyncHandler(requireActiveProfile), asyncHandler(registerPushToken));
profilesRouter.delete(
  "/:id",
  asyncHandler(requireActiveProfile),
  requireAccessLevel("MANAGE"),
  asyncHandler(deactivateProfile)
);
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
profilesRouter.post(
  "/:id/team-members/exit",
  asyncHandler(requireActiveProfile),
  asyncHandler(exitTeamMembership)
);
