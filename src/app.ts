// server.ts
import express, { Application } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";

// Local imports
import mongoDBconnection from "./db/mongodb/mongodb.connection.js";
import router from "./routes/router.js";
import handleSocketConnection from "./socket/socket.server.js";
import { setSecurityHeaders } from "./middleware/security.headers.js";
import { authenticateTokenSocket } from "./middleware/authentication.js";

dotenv.config();

await mongoDBconnection();

const PORT: number = parseInt(process.env.PORT || "3000");
const app: Application = express();
const server = createServer(app);

// ================== MIDDLEWARE ==================
app.use(cookieParser());
app.use(setSecurityHeaders);
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);


// ================== SOCKET.IO ==================
export const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Apply single JWT middleware for sockets
io.use(authenticateTokenSocket);

// ================== ROUTES ==================
app.use(router);

// ================== SOCKET HANDLERS ==================
handleSocketConnection(io);

// ================== START SERVER ==================
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
