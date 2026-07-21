import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { sendOtp, verifyOtp } from "../services/otp";
import { normalizePhoneNumber } from "../lib/phone";
import { AuthedRequest } from "../middleware/auth";

export async function requestOtp(req: Request, res: Response) {
  const { phoneNumber } = req.body ?? {};
  if (typeof phoneNumber !== "string" || phoneNumber.trim().length === 0) {
    return res.status(400).json({ error: "phoneNumber is required" });
  }

  await sendOtp(normalizePhoneNumber(phoneNumber));
  res.status(200).json({ ok: true });
}

export async function verifyOtpHandler(req: Request, res: Response) {
  const { phoneNumber: rawPhoneNumber, otp } = req.body ?? {};
  if (typeof rawPhoneNumber !== "string" || typeof otp !== "string") {
    return res.status(400).json({ error: "phoneNumber and otp are required" });
  }
  const phoneNumber = normalizePhoneNumber(rawPhoneNumber);

  if (!verifyOtp(phoneNumber, otp)) {
    return res.status(401).json({ error: "Invalid OTP" });
  }

  const user = await prisma.user.upsert({
    where: { phoneNumber },
    update: {},
    create: { phoneNumber },
  });

  // Claim any pending team-member invites for this phone number (added before this person ever signed up).
  await prisma.teamMember.updateMany({
    where: { phoneNumber, userId: null },
    data: { userId: user.id },
  });

  const token = jwt.sign({ userId: user.id, phoneNumber: user.phoneNumber }, env.jwtSecret, {
    expiresIn: "30d",
  });

  res.status(200).json({ token });
}

export async function setMyName(req: AuthedRequest, res: Response) {
  const { name } = req.body ?? {};

  if (typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "name is required" });
  }

  const user = await prisma.user.update({
    where: { id: req.user!.userId },
    data: { name: name.trim() },
  });

  res.status(200).json({ name: user.name });
}
