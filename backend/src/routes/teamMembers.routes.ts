import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { requireAccessLevel } from "../middleware/requirePermission";
import { asyncHandler } from "../middleware/asyncHandler";
import { removeTeamMember, updateTeamMember } from "../controllers/teamMembers.controller";

export const teamMembersRouter = Router();

teamMembersRouter.use(requireAuth);
teamMembersRouter.use(asyncHandler(requireActiveProfile));
teamMembersRouter.use(requireAccessLevel("MANAGE"));

teamMembersRouter.patch("/:id", asyncHandler(updateTeamMember));
teamMembersRouter.delete("/:id", asyncHandler(removeTeamMember));
