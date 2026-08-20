import { del, get, post } from "./client";

export interface GroupSupplier {
  id: string;
  phoneNumber: string;
  contactName: string | null;
  supplierProfileId: string | null;
  addedAt: string;
  supplierProfile?: { deactivatedAt: string | null } | null;
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
  isPinned?: boolean;
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
): Promise<{ suppliers: GroupSupplier[]; skipped: { phoneNumber: string; reason: string }[] }> {
  return post(`/groups/${groupId}/suppliers`, { contacts }, auth);
}

export function removeSupplier(auth: Auth, groupId: string, supplierId: string): Promise<void> {
  return del(`/groups/${groupId}/suppliers/${supplierId}`, auth);
}

export interface GroupMemberView {
  name: string;
  accessLevel: "VIEW" | "EDIT" | "MANAGE";
  pending: boolean;
}

export interface GroupMembers {
  buyer: { companyName: string; ownerName: string | null };
  buyerTeamMembers: GroupMemberView[];
  myTeamMembers: GroupMemberView[];
}

export function getGroupMembers(auth: Auth, groupId: string): Promise<GroupMembers> {
  return get(`/groups/${groupId}/members`, auth);
}

export function pinGroup(auth: Auth, groupId: string): Promise<void> {
  return post(`/groups/${groupId}/pin`, {}, auth);
}

export function unpinGroup(auth: Auth, groupId: string): Promise<void> {
  return del(`/groups/${groupId}/pin`, auth);
}
