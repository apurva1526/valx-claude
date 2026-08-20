import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";
import { profilesRouter } from "./routes/profiles.routes";
import { groupsRouter } from "./routes/groups.routes";
import { bidsRouter } from "./routes/bids.routes";
import { notificationsRouter } from "./routes/notifications.routes";
import { teamMembersRouter } from "./routes/teamMembers.routes";
import { PRIVACY_POLICY_HTML } from "./publicPages/privacy";
import { ASSET_LINKS } from "./publicPages/assetlinks";

export const app = express();

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[req] ${req.method} ${req.path} from ${req.ip}`);
  next();
});

app.get("/health", (_req, res) => res.status(200).json({ ok: true }));
app.get("/privacy", (_req, res) => res.type("html").send(PRIVACY_POLICY_HTML));
app.get("/.well-known/assetlinks.json", (_req, res) => res.status(200).json(ASSET_LINKS));

app.use("/auth", authRouter);
app.use("/profiles", profilesRouter);
app.use("/groups", groupsRouter);
app.use("/bids", bidsRouter);
app.use("/notifications", notificationsRouter);
app.use("/team-members", teamMembersRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
