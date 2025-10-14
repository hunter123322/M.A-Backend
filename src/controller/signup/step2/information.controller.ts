import {Request, Response } from "express";
import mySQLConnectionPool from "../../../db/mysql/mysql.connection-pool.js";
import { UserController } from "../../user.controller.js";
import type { UserInfo } from "../../../types/User.type.js";
import type { JWTPayload } from "../../../types/jtw.payload.type.js";

type AuthRequest<T = any> = Request<unknown, unknown, T> & {
  user?: JWTPayload;
};

// Handle post information - CONVERTED TO JWT
export async function postInformation(req: AuthRequest<UserInfo>, res: Response): Promise<void> {
  const userController = new UserController(mySQLConnectionPool);
  
  try {
    const userInfo = req.body;
    userInfo.age = Number(userInfo.age);
    if (!userInfo.middleName) userInfo.middleName = "";
    
    const user_id = req.user?.user_id;
    
    if (!user_id) {
      res.status(401).json({ message: "Unauthorized - No valid token" });
      return;
    }
    
    await userController.userInformationController(userInfo, user_id);
    res.status(200).json({ message: "OK" });
  } catch (error: any) {
    res.status(500).json({ message: "Server error please try again" });
    console.log(error);
  }
}