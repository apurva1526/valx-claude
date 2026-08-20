import { get, post } from "./client";

export interface RevisionEntry {
  price: number;
  comment: string | null;
  revisionNumber: number;
  revokedAt: string | null;
  createdAt: string;
}

export interface BuyerResponseRow {
  supplierProfileId: string;
  companyName: string;
  price: number;
  comment: string | null;
  revisionNumber: number;
  revokedAt: string | null;
  updatedAt: string;
  history: RevisionEntry[];
}

export interface YourResponse {
  price: number;
  comment: string | null;
  revisionNumber: number;
  revokedAt: string | null;
}

interface Auth {
  token: string;
  profileId: string;
}

export function submitResponse(
  auth: Auth,
  bidId: string,
  data: { price: number; comment?: string }
): Promise<{ response: { price: number; comment: string | null; revisionNumber: number } }> {
  return post(`/bids/${bidId}/responses`, data, auth);
}

export function getBuyerResponses(auth: Auth, bidId: string): Promise<{ responses: BuyerResponseRow[] }> {
  return get(`/bids/${bidId}/responses`, auth);
}

export function revokeResponse(auth: Auth, bidId: string): Promise<{ response: YourResponse }> {
  return post(`/bids/${bidId}/responses/revoke`, {}, auth);
}

export function getSupplierResponses(
  auth: Auth,
  bidId: string
): Promise<{ bestPrice: number | null; yourResponse: YourResponse | null; yourHistory: RevisionEntry[] }> {
  return get(`/bids/${bidId}/responses`, auth);
}
