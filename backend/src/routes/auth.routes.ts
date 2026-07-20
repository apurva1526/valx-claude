import { Router } from "express";
import { requestOtp, verifyOtpHandler } from "../controllers/auth.controller";
import { asyncHandler } from "../middleware/asyncHandler";

export const authRouter = Router();

authRouter.post("/otp/request", asyncHandler(requestOtp));
authRouter.post("/otp/verify", asyncHandler(verifyOtpHandler));
