import { app } from "./app";
import { env } from "./config/env";
import { attachChatWebSocketServer } from "./ws/chatServer";
import { startDeadlineAlertJob } from "./jobs/deadlineAlerts";

const server = app.listen(env.port, () => {
  console.log(`ValX backend listening on port ${env.port}`);
});

attachChatWebSocketServer(server);
startDeadlineAlertJob();
