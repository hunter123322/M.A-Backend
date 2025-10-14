import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";
import mySQLConnectionPool from "../../db/mysql/mysql.connection-pool";
import { UserController } from "../user.controller";

type AuthRequest<T = any> = Request<unknown, unknown, T> & {
    user?: JWTPayload;
};

// Check if user is authenticated - CONVERTED TO JWT
export async function initProfile(req: AuthRequest, res: Response): Promise<void> {
    const User = new UserController(mySQLConnectionPool);
    try {
        const user_id = req.user?.user_id;
        if (!user_id) throw new Error();

        const userProfile = await User.initProfile(user_id)
        res.status(200).json({ userProfile: userProfile })
    } catch (error) {
        console.error("Init profile Error:", error);
        res.status(500).json({ message: "Init profile Error" });
    }
}