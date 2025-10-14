import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";

type AuthRequest<T = any> = Request<unknown, unknown, T> & {
  user?: JWTPayload;
};

// Check if user is authenticated - CONVERTED TO JWT
export async function apiAuthCheck(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (req.user?.user_id) {
      res.status(200).json({
        message: "Authenticated",
        user: req.user,
      });
      return;
    }

    res.status(401).json({ loggedIn: false });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(500).json({ loggedIn: false, error: "Server error" });
  }
}