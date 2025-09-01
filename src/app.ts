// server.ts
import express, { Application } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createWorker } from "mediasoup";

import type { Worker, Router } from "mediasoup/node/lib/types";

// Local imports
import sessionMiddleware from "./middleware/session.js";
import mongoDBconnection from "./db/mongodb/mongodb.connection.js";
import router from "./routes/router.js";
import handleSocketConnection from "./socket/socket.server.js";
import { setSecurityHeaders } from "./middleware/security.headers.js";

dotenv.config();

await mongoDBconnection();

const PORT: number = parseInt(process.env.PORT || "3000", 10);
const app: Application = express();
const server = createServer(app);

// Use the session middleware once before the Socket.IO server is created
app.use(cookieParser());
app.use(setSecurityHeaders);
app.use(express.json());
app.use(sessionMiddleware);
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// Mediasoup globals
let worker: Worker;
let mediasoupRouter: Router;

async function initMediasoup() {
  worker = await createWorker();
  mediasoupRouter = await worker.createRouter({
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
      },
    ],
  });
  console.log("✅ Mediasoup worker and router is ready!");
  return mediasoupRouter;
}

// Boot server
async function startServer() {
  try {
    const mediasoupRouter = await initMediasoup();

    io.use((socket, next) => {
      if (!socket.request) {
        return next(new Error("Socket request not available."));
      }
      const req = socket.request as any;
      // Use the session from the Express middleware
      req.session = req.session;
      next();
    });

    app.use(router);

    // Pass the router accessor
    handleSocketConnection(io, () => mediasoupRouter);

    server.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server due to mediasoup initialization error:");
    console.error(error);
    // Exit the process so you can address the error
    process.exit(1);
  }
}

startServer();