import { Request, Response } from "express";
import { SQLConn } from "../../db/mysql/mysql.connection-pool";
import { RowDataPacket } from "mysql2";
import { UserProfile } from "../../types/User.type";

type CombinedUser = RowDataPacket & {
    user_id: number;
    firstName: string;
    lastName: string;
    middleName?: string;
    age?: string;
} & UserProfile;

export async function searchContact(req: Request, res: Response) {
    try {
        const dbConnection = await SQLConn;
        const { contactSearch } = req.query as { contactSearch?: string };

        if (!contactSearch) {
            res.status(400).json({ message: "Missing search query" });
            return;
        }

        // ✅ Fixed: removed extra comma before FROM
        const [rows] = await dbConnection.query<CombinedUser[]>(
            `
      SELECT 
        users_info.user_id,
        users_info.firstName,
        users_info.lastName,
        users_info.middleName,
        users_info.age,
        users_profile.user_bio,
        users_profile.user_follower,
        users_profile.user_avatar,
        users_profile.user_nickname,
        users_profile.user_following
      FROM users_info
      LEFT JOIN users_profile 
        ON users_info.user_id = users_profile.user_id
      WHERE users_info.firstName LIKE ? 
         OR users_info.lastName LIKE ?
         OR users_profile.user_nickname LIKE ?
      `,
            [`%${contactSearch}%`, `%${contactSearch}%`, `%${contactSearch}%`]
        );

        dbConnection.release();

        if (!rows || rows.length === 0) {
            res.status(204).json({ message: "No such user!" });
            return;
        }

        res.status(200).json(rows);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Server error" });
    }
}
