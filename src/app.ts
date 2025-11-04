// server.ts
import express, { Application } from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import cors from "cors";
import cookieParser from "cookie-parser";

// Local imports
import mongoDBconnection from "./db/mongodb/mongodb.connection.js";
import router from "./routes/router.js";
import { setSecurityHeaders } from "./middleware/security.headers.js";

dotenv.config();

await mongoDBconnection();

const PORT: number = parseInt(process.env.PORT || "3000");
const app: Application = express();
const server = createServer(app);

// ================== MIDDLEWARE ==================
app.use(cookieParser());
app.use(setSecurityHeaders);
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use((req, res, next) => {
  if (req.is("multipart/form-data")) return next();
  express.json()(req, res, next);
});

// ================== ROUTES ==================
app.use(router);


// ================== START SERVER ==================
server.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
