import { Request, Response } from "express"
import type { JWTPayload } from "../../types/jtw.payload.type";
import { UserTransaction } from "../../service/user/user.service";
import mySQLConnectionPool from "../../db/mysql/mysql.connection-pool";


type AuthRequest<T = any> = Request<unknown, unknown, T, { user: string }> & {
    user?: JWTPayload;
};
export class Search {
    static async user(req: AuthRequest, res: Response) {
        const userTransaction = new UserTransaction(mySQLConnectionPool)
        try {
            const user_id = req.query.user
            const profile = await userTransaction.fetchUserProfile(user_id, true);
            if (!profile) {
                res.status(404).json({ message: "User can not find!" });
                return
            }
            console.log(profile);

            res.status(200).json({ profile })
        } catch (error) {

        }
    }
}