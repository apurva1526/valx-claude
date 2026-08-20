import { post } from "./client";

interface Auth {
  token: string;
  profileId: string;
}

export function registerPushToken(auth: Auth, token: string): Promise<void> {
  return post(`/profiles/${auth.profileId}/push-token`, { token }, auth);
}
