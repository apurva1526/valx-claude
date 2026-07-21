import { get, post } from "./client";

export interface GroupSupplier {
  id: string;
  phoneNumber: string;
  contactName: string | null;
  supplierProfileId: string | null;
  addedAt: string;
}

export interface GroupListItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  _count?: { suppliers: number };
  buyerProfile?: { companyName: string };
  hasUnread?: boolean;
}

export interface BuyerGroupDetail {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  buyerProfile: { companyName: string };
  suppliers: GroupSupplier[];
}

export interface SupplierGroupDetail {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  buyerCompanyName: string;
}

interface Auth {
  token: string;
  profileId: string;
}

export function createGroup(auth: Auth, data: { name: string; description?: string }): Promise<{ group: GroupListItem }> {
  return post("/groups", data, auth);
}

export function getMyGroups(auth: Auth): Promise<{ groups: GroupListItem[] }> {
  return get("/groups", auth);
}

export function getGroupDetail(
  auth: Auth,
  groupId: string
): Promise<{ group: BuyerGroupDetail | SupplierGroupDetail }> {
  return get(`/groups/${groupId}`, auth);
}

export function addSuppliers(
  auth: Auth,
  groupId: string,
  contacts: { phoneNumber: string; name: string }[]
): Promise<{ suppliers: GroupSupplier[] }> {
  return post(`/groups/${groupId}/suppliers`, { contacts }, auth);
}
