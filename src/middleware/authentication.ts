import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Socket } from "socket.io";


const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "24h";

interface JWTPayload {
  user_id: number;
  email: string;
}

interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: "Access token required" });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};


export const authenticateTokenSocket = (
  socket: Socket,
  next: (err?: Error) => void
): void => {
  const token =
    (socket.handshake.auth?.token as string) ||
    (socket.handshake.headers?.authorization?.split(" ")[1] as string);

  if (!token) {
    return next(new Error("Authentication error: token required"));
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    (socket as any).user = decoded; // Attach user payload
    next();
  } catch (error) {
    return next(new Error("Authentication error: invalid token"));
  }
};