import { get, post } from "./client";

export type ProfileType = "BUYER" | "SUPPLIER";

export interface Profile {
  id: string;
  companyName: string;
  profileType: ProfileType;
  gstNumber: string | null;
  phoneNumber: string;
}

export function requestOtp(phoneNumber: string): Promise<{ ok: true }> {
  return post("/auth/otp/request", { phoneNumber });
}

export function verifyOtp(phoneNumber: string, otp: string): Promise<{ token: string }> {
  return post("/auth/otp/verify", { phoneNumber, otp });
}

export function getMyProfiles(token: string): Promise<{ profiles: Profile[] }> {
  return get("/profiles/me", { token });
}

export function createProfile(
  token: string,
  data: { name: string; companyName: string; profileType: ProfileType; gstNumber?: string }
): Promise<{ profile: Profile }> {
  return post("/profiles", data, { token });
}
