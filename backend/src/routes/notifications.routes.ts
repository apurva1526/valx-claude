import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notifications.controller";

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);
notificationsRouter.use(asyncHandler(requireActiveProfile));

notificationsRouter.get("/", asyncHandler(getMyNotifications));
notificationsRouter.post("/read-all", asyncHandler(markAllNotificationsRead));
notificationsRouter.post("/:id/read", asyncHandler(markNotificationRead));
