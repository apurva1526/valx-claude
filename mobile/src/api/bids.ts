import { get, patch, post } from "./client";

export type BidStatus = "ONGOING" | "CLOSED";
export type Currency = "INR" | "USD";

export interface AwardRecord {
  id: string;
  awardedSupplierIds: string[];
  averagePrice: number | null;
  closedByProfileId: string;
  closedAt: string;
}

export interface Bid {
  id: string;
  groupId: string;
  title: string;
  description: string;
  targetPrice: number | null;
  targetPriceCurrency: Currency;
  validityDeadline: string;
  status: BidStatus;
  createdByProfileId: string;
  createdAt: string;
  createdByProfile?: { companyName: string };
  awardRecord?: AwardRecord | null;
  awardOutcome?: { wasAwarded: boolean };
}

interface Auth {
  token: string;
  profileId: string;
}

export function createBid(
  auth: Auth,
  groupId: string,
  data: {
    title: string;
    description: string;
    validityDeadline: string;
    targetPrice?: number;
    targetPriceCurrency?: Currency;
  }
): Promise<{ bid: Bid }> {
  return post(`/groups/${groupId}/bids`, data, auth);
}

export function getGroupBids(auth: Auth, groupId: string): Promise<{ bids: Bid[] }> {
  return get(`/groups/${groupId}/bids`, auth);
}

export function getBidDetail(auth: Auth, bidId: string): Promise<{ bid: Bid }> {
  return get(`/bids/${bidId}`, auth);
}

export function updateBid(
  auth: Auth,
  bidId: string,
  data: {
    title: string;
    description: string;
    validityDeadline: string;
    targetPrice?: number;
    targetPriceCurrency?: Currency;
  }
): Promise<{ bid: Bid }> {
  return patch(`/bids/${bidId}`, data, auth);
}
