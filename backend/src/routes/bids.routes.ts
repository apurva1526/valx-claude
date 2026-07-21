import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import { getBidDetail, updateBid } from "../controllers/bids.controller";
import { getBidResponses, submitResponse } from "../controllers/bidResponses.controller";
import { closeBid } from "../controllers/awards.controller";
import { getChatHistory, postChatMessage } from "../controllers/chat.controller";

export const bidsRouter = Router();

bidsRouter.use(requireAuth);
bidsRouter.use(asyncHandler(requireActiveProfile));

bidsRouter.get("/:id", asyncHandler(getBidDetail));
bidsRouter.patch("/:id", asyncHandler(updateBid));
bidsRouter.post("/:id/responses", asyncHandler(submitResponse));
bidsRouter.get("/:id/responses", asyncHandler(getBidResponses));
bidsRouter.post("/:id/close", asyncHandler(closeBid));
bidsRouter.get("/:id/chat", asyncHandler(getChatHistory));
bidsRouter.post("/:id/chat", asyncHandler(postChatMessage));
