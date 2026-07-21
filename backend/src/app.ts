import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { profilesRouter } from "./routes/profiles.routes";
import { groupsRouter } from "./routes/groups.routes";

export const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));

app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/groups", groupsRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
