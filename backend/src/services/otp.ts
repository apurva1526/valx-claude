// Everything outside this file should only ever call sendOtp/verifyOtp.
import { prisma } from "../lib/prisma";
import { env } from "../config/env";

const BASE_URL = "https://2factor.in/API/V1";
// DLT-registered SMS template name in 2Factor.in's dashboard — required as of DLT registration.
const OTP_TEMPLATE_NAME = "OTP_Login";

interface TwoFactorResponse {
  Status: "Success" | "Error";
  Details: string;
}

function requireApiKey(): string {
  if (!env.twoFactorApiKey) {
    throw new Error("TWO_FACTOR_API_KEY is not set — OTP delivery requires a 2Factor.in API key. See README for setup.");
  }
  return env.twoFactorApiKey;
}

export async function sendOtp(phoneNumber: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/${requireApiKey()}/SMS/${phoneNumber}/AUTOGEN/${OTP_TEMPLATE_NAME}`);
  const data = (await res.json()) as TwoFactorResponse;
  if (data.Status !== "Success") {
    throw new Error(`Couldn't send OTP: ${data.Details ?? "unknown error"}`);
  }

  await prisma.otpChallenge.upsert({
    where: { phoneNumber },
    update: { sessionId: data.Details },
    create: { phoneNumber, sessionId: data.Details },
  });
}

export async function verifyOtp(phoneNumber: string, otp: string): Promise<boolean> {
  const challenge = await prisma.otpChallenge.findUnique({ where: { phoneNumber } });
  if (!challenge) return false;

  const res = await fetch(`${BASE_URL}/${requireApiKey()}/SMS/VERIFY/${challenge.sessionId}/${otp}`);
  const data = (await res.json()) as TwoFactorResponse;
  const success = data.Status === "Success";

  if (success) {
    await prisma.otpChallenge.delete({ where: { phoneNumber } }).catch(() => {});
  }

  return success;
}
