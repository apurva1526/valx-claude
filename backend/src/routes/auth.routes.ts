import { Router } from "express";
import { deleteMyAccount, requestOtp, setMyName, verifyOtpHandler } from "../controllers/auth.controller";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

authRouter.post("/otp/request", asyncHandler(requestOtp));
authRouter.post("/otp/verify", asyncHandler(verifyOtpHandler));
authRouter.patch("/name", requireAuth, asyncHandler(setMyName));
authRouter.delete("/me", requireAuth, asyncHandler(deleteMyAccount));
