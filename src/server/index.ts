import express from "express";
import http from "http";
import cors from "cors";
import router from "./routes/api.ts";
import { initWebSocket } from "./ws.ts";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);

const server = http.createServer(app);

initWebSocket(server);

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`API адрес: http://localhost:${PORT}`);
});
