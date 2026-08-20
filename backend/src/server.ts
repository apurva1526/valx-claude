import { app } from "./app";
import { env } from "./config/env";
import { attachChatWebSocketServer } from "./ws/chatServer";
import { startDeadlineAlertJob } from "./jobs/deadlineAlerts";

const server = app.listen(env.port, () => {
  console.log(`ValX backend listening on port ${env.port}`);
});

// Node's default keepAliveTimeout (5s) is shorter than Railway edge's idle timeout on its
// side of the connection, so the edge can forward a request over a socket Node just closed,
// producing a raw connection reset for the client. Keep ours longer than the proxy's.
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

attachChatWebSocketServer(server);
startDeadlineAlertJob();
