import { Request, Response } from "express";
import mySQLConnectionPool from "../../../db/mysql/mysql.connection-pool.js";
import { UserController } from "../../user.controller.js";
import type { UserAut } from "../../../types/User.type.js";
import { generateToken } from "../../../middleware/auth.middleware.js";

export async function postSignup(req: Request, res: Response): Promise<void> {
  const userController = new UserController(mySQLConnectionPool);

  try {
    const userAut: UserAut = req.body;

    if (!userAut || !userAut.email || !userAut.username || !userAut.password) {
      res.status(400).json({ error: "Invalid request data" });
      return;
    }

    // ✅ Check if username is already taken
    const [usernameRows] = await mySQLConnectionPool.query(
      "SELECT COUNT(*) as count FROM users WHERE username = ?",
      [userAut.username]
    );
    const usernameTaken = Array.isArray(usernameRows)
      ? (usernameRows[0] as any).count > 0
      : false;

    if (usernameTaken) {
      res.status(409).json({ error: "Username already taken" });
      return;
    }

    // ✅ Check if email already exists
    const [emailRows] = await mySQLConnectionPool.query(
      "SELECT COUNT(*) as count FROM users WHERE email = ?",
      [userAut.email]
    );
    const emailTaken = Array.isArray(emailRows)
      ? (emailRows[0] as any).count > 0
      : false;

    if (emailTaken) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    // ✅ Create user and get user_id
    const user_id = await userController.signController(
      userAut.email,
      userAut.password,
      userAut.username
    );

    // ✅ Generate JWT token
    const token = generateToken({
      user_id,
      username: userAut.username,
    });

    // ✅ Return success
    res.status(200).json({
      message: "Signup successful",
      user_id,
      token,
    });
  } catch (error: any) {
    console.error("Error during signup:", error);
    res.status(500).json({ error: error.message });
  }
}
