import { post } from "./client";
import { AwardRecord } from "./bids";

interface Auth {
  token: string;
  profileId: string;
}

export function closeBid(
  auth: Auth,
  bidId: string,
  awards: { supplierProfileId: string; comment?: string }[]
): Promise<{ award: AwardRecord }> {
  return post(`/bids/${bidId}/close`, { awards }, auth);
}
