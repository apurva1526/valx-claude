import { get, post } from "./client";
import { WS_BASE_URL } from "./config";

export interface ChatMessage {
  id: string;
  text: string;
  type: "text" | "system";
  createdAt: number;
  senderLabel: string;
  isYou: boolean;
}

interface Auth {
  token: string;
  profileId: string;
}

export function getChatHistory(auth: Auth, bidId: string): Promise<{ messages: ChatMessage[] }> {
  return get(`/bids/${bidId}/chat`, auth);
}

export function sendChatMessage(auth: Auth, bidId: string, text: string): Promise<{ message: ChatMessage }> {
  return post(`/bids/${bidId}/chat`, { text }, auth);
}

export function openChatSocket(
  bidId: string,
  auth: Auth,
  onMessage: (message: ChatMessage) => void
): WebSocket {
  const url = `${WS_BASE_URL}/ws/bids/${bidId}?token=${encodeURIComponent(auth.token)}&profileId=${encodeURIComponent(auth.profileId)}`;
  const ws = new WebSocket(url);

  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data as string) as ChatMessage;
      onMessage(message);
    } catch {
      // ignore malformed frames
    }
  };

  return ws;
}
