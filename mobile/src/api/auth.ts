import { del, get, patch, post } from "./client";

export type ProfileType = "BUYER" | "SUPPLIER";
export type AccessLevel = "OWNER" | "VIEW" | "EDIT" | "MANAGE";

export interface Profile {
  id: string;
  companyName: string;
  profileType: ProfileType;
  gstNumber: string | null;
  phoneNumber: string;
  access: AccessLevel;
  scopeGroupId: string | null;
}

export function requestOtp(phoneNumber: string): Promise<{ ok: true }> {
  return post("/auth/otp/request", { phoneNumber });
}

export function verifyOtp(phoneNumber: string, otp: string): Promise<{ token: string }> {
  return post("/auth/otp/verify", { phoneNumber, otp });
}

export interface DeactivatedProfile {
  id: string;
  companyName: string;
  profileType: ProfileType;
  phoneNumber: string;
  deactivatedAt: string;
}

export function getMyProfiles(
  token: string
): Promise<{
  profiles: Profile[];
  deactivatedProfiles: DeactivatedProfile[];
  name: string | null;
  phoneNumber: string | null;
}> {
  return get("/profiles/me", { token });
}

export function createProfile(
  token: string,
  data: { name?: string; companyName: string; profileType: ProfileType; gstNumber?: string }
): Promise<{ profile: Profile }> {
  return post("/profiles", data, { token });
}

export function switchProfile(token: string, profileId: string): Promise<{ profile: Profile }> {
  return post(`/profiles/${profileId}/switch`, {}, { token });
}

export function setMyName(token: string, name: string): Promise<{ name: string }> {
  return patch("/auth/name", { name }, { token });
}

export function deleteMyAccount(token: string): Promise<void> {
  return del("/auth/me", { token });
}

interface Auth {
  token: string;
  profileId: string;
}

export function updateProfile(
  auth: Auth,
  profileId: string,
  data: { companyName?: string; gstNumber?: string }
): Promise<{ profile: Profile }> {
  return patch(`/profiles/${profileId}`, data, auth);
}

export function deactivateProfile(
  auth: Auth,
  profileId: string
): Promise<{ profile: Profile; bidsClosed: number; responsesWithdrawn: number }> {
  return del(`/profiles/${profileId}`, auth);
}

export function reactivateProfile(token: string, profileId: string): Promise<{ profile: Profile }> {
  return post(`/profiles/${profileId}/reactivate`, {}, { token });
}
