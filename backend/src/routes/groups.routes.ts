import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireActiveProfile } from "../middleware/activeProfile";
import { asyncHandler } from "../middleware/asyncHandler";
import {
  addSuppliers,
  createGroup,
  getGroupDetail,
  getGroupMembers,
  getMyGroups,
  pinGroup,
  removeSupplierFromGroup,
  unpinGroup,
} from "../controllers/groups.controller";
import { createBid, getGroupBids } from "../controllers/bids.controller";
import { requireAccessLevel } from "../middleware/requirePermission";

export const groupsRouter = Router();

groupsRouter.use(requireAuth);
groupsRouter.use(asyncHandler(requireActiveProfile));

groupsRouter.post("/", requireAccessLevel("MANAGE"), asyncHandler(createGroup));
groupsRouter.get("/", asyncHandler(getMyGroups));
groupsRouter.get("/:id", asyncHandler(getGroupDetail));
groupsRouter.get("/:id/members", asyncHandler(getGroupMembers));
groupsRouter.post("/:id/pin", asyncHandler(pinGroup));
groupsRouter.delete("/:id/pin", asyncHandler(unpinGroup));
groupsRouter.post("/:id/suppliers", requireAccessLevel("MANAGE"), asyncHandler(addSuppliers));
groupsRouter.delete("/:id/suppliers/:supplierId", requireAccessLevel("MANAGE"), asyncHandler(removeSupplierFromGroup));
groupsRouter.post("/:id/bids", requireAccessLevel("EDIT"), asyncHandler(createBid));
groupsRouter.get("/:id/bids", asyncHandler(getGroupBids));
