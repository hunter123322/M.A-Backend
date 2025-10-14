import { Request, Response } from "express";
import mySQLConnectionPool from "../../../db/mysql/mysql.connection-pool.js";
import { UserController } from "../../user.controller.js";
import type { UserLocation } from "../../../types/User.type.js";
import type { JWTPayload } from "../../../types/jtw.payload.type.js";

type AuthRequest<T = any> = Request<unknown, unknown, T> & {
  user?: JWTPayload;
};

// Handle post location - CONVERTED TO JWT
export async function postLocation(req: AuthRequest<UserLocation>, res: Response): Promise<void> {
  const userController = new UserController(mySQLConnectionPool);

  try {
    const userLoc = req.body; // ✅ now properly typed as UserLocation

    const user_id = req.user?.user_id;

    if (!user_id) {
      res.status(401).json({ message: "Unauthorized - No valid token" });
      return;
    }

    await userController.locationController(userLoc, user_id);
    res.status(200).json({ message: "Signup successful", redirectUrl: "/socket/v1" });
  } catch (error) {
    res.status(500).json({ message: "Server error, please try again" });
  }
}
