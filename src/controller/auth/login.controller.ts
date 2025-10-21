import { Request, Response } from "express";
import mySQLConnectionPool from "../../db/mysql/mysql.connection-pool.js";
import { UserController } from "../user.controller.js";
import type { UserAut } from "../../types/User.type.js";
import { generateToken } from "../../middleware/auth.middleware.js";


async function postLogin(req: Request, res: Response): Promise<void> {
  const User = new UserController(mySQLConnectionPool);

  try {
    const userData: UserAut = req.body;

    if (!userData.email || !userData.password) {
      res.status(400).json({ error: "email and password required" });
      return;
    }

    const data = await User.loginController(userData);

    const userProfile = await User.initProfile(data.user_id)


    const author = {
      id: data.user_id,
      username: data.authentication.username,
      avatarUrl: userProfile.userProfileData.user_avatar
    }

    const token = generateToken({
      user_id: data.user_id,
      username: userData.username,
      author: author
    });


    res.status(200).json({
      message: "Login successful",
      token: token,
      user_id: data.user_id,
      messages: data.messages,
      userInfo: data.authentication,
      userProfile: userProfile
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
    console.log(error);
  }
}

export { postLogin };