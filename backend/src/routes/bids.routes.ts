import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import { getBidDetail, updateBid } from "../controllers/bids.controller";
import { getBidResponses, submitResponse } from "../controllers/bidResponses.controller";
import { closeBid } from "../controllers/awards.controller";
import { getChatHistory, postChatMessage } from "../controllers/chat.controller";
import { requireAccessLevel } from "../middleware/requirePermission";

export const bidsRouter = Router();

bidsRouter.use(requireAuth);
bidsRouter.use(asyncHandler(requireActiveProfile));

bidsRouter.get("/:id", asyncHandler(getBidDetail));
bidsRouter.patch("/:id", requireAccessLevel("EDIT"), asyncHandler(updateBid));
bidsRouter.post("/:id/responses", requireAccessLevel("EDIT"), asyncHandler(submitResponse));
bidsRouter.get("/:id/responses", asyncHandler(getBidResponses));
bidsRouter.post("/:id/close", requireAccessLevel("EDIT"), asyncHandler(closeBid));
bidsRouter.get("/:id/chat", asyncHandler(getChatHistory));
bidsRouter.post("/:id/chat", requireAccessLevel("EDIT"), asyncHandler(postChatMessage));
