import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import { getBidDetail } from "../controllers/bids.controller";

export const bidsRouter = Router();

bidsRouter.use(requireAuth);
bidsRouter.use(asyncHandler(requireActiveProfile));

bidsRouter.get("/:id", asyncHandler(getBidDetail));
