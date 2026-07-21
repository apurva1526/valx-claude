import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import { getMyNotifications, markNotificationRead } from "../controllers/notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.use(asyncHandler(requireActiveProfile));

notificationsRouter.get("/", asyncHandler(getMyNotifications));
notificationsRouter.post("/:id/read", asyncHandler(markNotificationRead));
