import { post } from "./client";
import { AwardRecord } from "./bids";

interface Auth {
  token: string;
  profileId: string;
}

export function closeBid(
  auth: Auth,
  bidId: string,
  awardedSupplierIds: string[]
): Promise<{ award: AwardRecord }> {
  return post(`/bids/${bidId}/close`, { awardedSupplierIds }, auth);
}
