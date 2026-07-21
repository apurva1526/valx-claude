import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import { getBidDetail } from "../controllers/bids.controller";
import { getBidResponses, submitResponse } from "../controllers/bidResponses.controller";

export const bidsRouter = Router();

bidsRouter.use(requireAuth);
bidsRouter.use(asyncHandler(requireActiveProfile));

bidsRouter.get("/:id", asyncHandler(getBidDetail));
bidsRouter.post("/:id/responses", asyncHandler(submitResponse));
bidsRouter.get("/:id/responses", asyncHandler(getBidResponses));
