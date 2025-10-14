import { RowDataPacket, Pool, PoolConnection } from 'mysql2/promise';
import mySQLConnectionPool from '../../db/mysql/mysql.connection-pool';
import { UserInfo } from '../../types/User.type';


export async function initUserInfo(user_id: number) {
    const SQLConn = await mySQLConnectionPool.getConnection();
    try {
        const [rows] = await SQLConn.query<RowDataPacket[]>(
            "SELECT * FROM users_info WHERE user_id = ?",
            [user_id]
        );
        return rows[0] as UserInfo;
    } catch (error) {
        throw new Error("Error initialize the user info!");
    }
}