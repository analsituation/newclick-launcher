import { WebSocketServer } from "ws";
import type { WebSocket } from "ws";
import http from "http";
import { runningProcesses } from "./services/index.ts";

let wss: WebSocketServer;

export function initWebSocket(server: http.Server) {
  wss = new WebSocketServer({ server });

  wss.on("connection", (ws: WebSocket) => {
    ws.send(JSON.stringify({ type: "processes", data: runningProcesses }));
  });
}

export function broadcastProcesses() {
  console.log("runningProcesses", runningProcesses);
  const message = JSON.stringify({ type: "processes", data: runningProcesses });

  wss?.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}
