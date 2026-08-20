import { get, patch, post, del } from "./client";

export type TeamMemberAccessLevel = "VIEW" | "EDIT" | "MANAGE";

export interface TeamMember {
  id: string;
  profileId: string;
  phoneNumber: string;
  contactName: string | null;
  userId: string | null;
  accessLevel: TeamMemberAccessLevel;
  scopeGroupId: string | null;
  createdAt: string;
  user?: { name: string | null; phoneNumber: string } | null;
}

interface Auth {
  token: string;
  profileId: string;
}

export interface TeamOwner {
  phoneNumber: string;
  name: string | null;
}

export function listTeamMembers(
  auth: Auth,
  profileId: string
): Promise<{ owner: TeamOwner | null; teamMembers: TeamMember[] }> {
  return get(`/profiles/${profileId}/team-members`, auth);
}

export function addTeamMember(
  auth: Auth,
  profileId: string,
  data: { phoneNumber: string; name: string; accessLevel?: TeamMemberAccessLevel; scopeGroupId?: string }
): Promise<{ teamMember: TeamMember }> {
  return post(`/profiles/${profileId}/team-members`, data, auth);
}

export function updateTeamMember(
  auth: Auth,
  teamMemberId: string,
  data: { accessLevel?: TeamMemberAccessLevel; scopeGroupId?: string | null }
): Promise<{ teamMember: TeamMember }> {
  return patch(`/team-members/${teamMemberId}`, data, auth);
}

export function removeTeamMember(auth: Auth, teamMemberId: string): Promise<void> {
  return del(`/team-members/${teamMemberId}`, auth);
}

export function exitTeamMembership(auth: Auth, profileId: string): Promise<void> {
  return post(`/profiles/${profileId}/team-members/exit`, {}, auth);
}
