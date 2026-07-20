import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { sendOtp, verifyOtp } from "../services/otp";

export async function requestOtp(req: Request, res: Response) {
  const { phoneNumber } = req.body ?? {};
  if (typeof phoneNumber !== "string" || phoneNumber.trim().length === 0) {
    return res.status(400).json({ error: "phoneNumber is required" });
  }

  await sendOtp(phoneNumber);
  res.status(200).json({ ok: true });
}

export async function verifyOtpHandler(req: Request, res: Response) {
  const { phoneNumber, otp } = req.body ?? {};
  if (typeof phoneNumber !== "string" || typeof otp !== "string") {
    return res.status(400).json({ error: "phoneNumber and otp are required" });
  }

  if (!verifyOtp(phoneNumber, otp)) {
    return res.status(401).json({ error: "Invalid OTP" });
  }

  const user = await prisma.user.upsert({
    where: { phoneNumber },
    update: {},
    create: { phoneNumber },
  });

  const token = jwt.sign({ userId: user.id, phoneNumber: user.phoneNumber }, env.jwtSecret, {
    expiresIn: "30d",
  });

  res.status(200).json({ token });
}
