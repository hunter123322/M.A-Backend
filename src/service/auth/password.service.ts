import bcrypt from "bcryptjs";
import mySQLConnectionPool from "../../db/mysql/mysql.connection-pool.js";
import { RowDataPacket } from 'mysql2/promise';
import { UserModel } from "../../model/user/user.model.js";
import type { UserAut, UserInfo } from "../../types/User.type.js";

type UserAuthFull = UserAut & UserInfo & {
  username: string
};

async function passwordHasher(password: string): Promise<string> {
  if (typeof password !== "string") {
    throw new TypeError("Password must be a string");
  }

  const saltRounds = 10;
  if (typeof saltRounds !== "number" || isNaN(saltRounds)) {
    throw new TypeError("Salt rounds must be a valid number");
  }

  try {
    return await bcrypt.hash(password, saltRounds);
  } catch (error) {
    throw new Error(`Cannot encrypt the password: ${(error as Error).message}`);

  }
}


async function compareEncryptedPassword(
  email: string,
  password: string
): Promise<UserAuthFull> {
  const connection = await mySQLConnectionPool.getConnection();
  const initUserInfo = new UserModel(mySQLConnectionPool);
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM users_auth WHERE email = ?",
      [email]
    );

    if (!rows || rows.length === 0) {
      throw new Error("email not found!");
    }

    const user = rows[0] as UserAut;
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log(passwordMatch,);
      
      throw new Error("Incorrect password!");
    }

    const userInfo = await initUserInfo.initUserInfo(user.user_id as number);
    const returnValue = { ...user, ...userInfo } as UserAuthFull;

    return returnValue;
  } catch (error) {
    throw error;
  } finally {
    connection.release();
  }
}


export default { passwordHasher, compareEncryptedPassword };
export {passwordHasher, compareEncryptedPassword}