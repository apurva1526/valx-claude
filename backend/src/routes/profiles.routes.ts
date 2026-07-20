import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { createProfile, getMyProfiles } from "../controllers/profiles.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const profilesRouter = Router();

profilesRouter.use(requireAuth);
profilesRouter.get("/me", asyncHandler(getMyProfiles));
profilesRouter.post("/", asyncHandler(createProfile));
