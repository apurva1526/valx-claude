import { Server } from "http";
import { URL } from "url";
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import { ProfileType } from "@prisma/client";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { getGroupForProfile } from "../lib/groupAccess";

interface Connection {
  ws: WebSocket;
  profileId: string;
  profileType: ProfileType;
}

const bidConnections = new Map<string, Set<Connection>>();

export function broadcastToBid(bidId: string, buildPayload: (conn: Connection) => unknown): void {
  const conns = bidConnections.get(bidId);
  if (!conns) return;

  for (const conn of conns) {
    if (conn.ws.readyState === WebSocket.OPEN) {
      conn.ws.send(JSON.stringify(buildPayload(conn)));
    }
  }
}

export function attachChatWebSocketServer(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const match = url.pathname.match(/^\/ws\/bids\/([^/]+)$/);
    if (!match) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, { bidId: match[1], searchParams: url.searchParams });
    });
  });

  wss.on("connection", async (ws: WebSocket, ctx: { bidId: string; searchParams: URLSearchParams }) => {
    const { bidId, searchParams } = ctx;
    const token = searchParams.get("token");
    const profileId = searchParams.get("profileId");

    if (!token || !profileId) {
      ws.close(4001, "Missing token or profileId");
      return;
    }

    let userId: string;
    try {
      const payload = jwt.verify(token, env.jwtSecret) as { userId: string };
      userId = payload.userId;
    } catch {
      ws.close(4001, "Invalid token");
      return;
    }

    const profile = await prisma.profile.findUnique({ where: { id: profileId } });
    if (!profile || profile.userId !== userId) {
      ws.close(4003, "Profile does not belong to the authenticated user");
      return;
    }

    const bid = await prisma.bid.findUnique({ where: { id: bidId } });
    if (!bid) {
      ws.close(4004, "Bid not found");
      return;
    }

    const { isMember } = await getGroupForProfile(bid.groupId, { id: profile.id, profileType: profile.profileType });
    if (!isMember) {
      ws.close(4003, "Not a member of this bid's group");
      return;
    }

    const conn: Connection = { ws, profileId: profile.id, profileType: profile.profileType };
    if (!bidConnections.has(bidId)) {
      bidConnections.set(bidId, new Set());
    }
    bidConnections.get(bidId)!.add(conn);

    ws.on("close", () => {
      bidConnections.get(bidId)?.delete(conn);
    });
  });
}
