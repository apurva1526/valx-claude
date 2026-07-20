import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthedRequest extends Request {
  user?: { userId: string; phoneNumber: string };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Missing bearer token" });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret) as { userId: string; phoneNumber: string };
    req.user = { userId: payload.userId, phoneNumber: payload.phoneNumber };
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
