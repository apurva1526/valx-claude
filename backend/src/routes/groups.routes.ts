import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import { addSuppliers, createGroup, getGroupDetail, getMyGroups } from "../controllers/groups.controller";
import { createBid, getGroupBids } from "../controllers/bids.controller";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);
groupsRouter.use(asyncHandler(requireActiveProfile));

groupsRouter.post("/", asyncHandler(createGroup));
groupsRouter.get("/", asyncHandler(getMyGroups));
groupsRouter.get("/:id", asyncHandler(getGroupDetail));
groupsRouter.post("/:id/suppliers", asyncHandler(addSuppliers));
groupsRouter.post("/:id/bids", asyncHandler(createBid));
groupsRouter.get("/:id/bids", asyncHandler(getGroupBids));
