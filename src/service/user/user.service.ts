import { ResultSetHeader, Pool, PoolConnection, RowDataPacket } from "mysql2/promise";
import type { UserInfo, UserLocation, UserProfile } from "../../types/User.type";
import mySQLConnectionPool from "../../db/mysql/mysql.connection-pool";

export class UserTransaction {
    constructor(private pool: Pool) { }

    private async withTransaction<T>(operation: (conn: PoolConnection) => Promise<T>): Promise<T> {
        const conn = await this.pool.getConnection();

        try {
            await conn.beginTransaction();
            const result = await operation(conn);
            await conn.commit();
            return result;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    public async signupCredential(
        email: string,
        hashedPassword: string,
        username: string
    ): Promise<number> {
        return this.withTransaction(async (conn) => {
            const [result] = await conn.execute<ResultSetHeader>(
                `INSERT INTO users_auth (email, password, username) VALUES (?, ?, ?)`,
                [email, hashedPassword, username]
            );
            return result.insertId;
        });
    }

    public async informationCredential(
        data: UserInfo,
        userId: number | undefined
    ): Promise<void> {
        const capitalizeWords = (str?: string) =>
            str
                ? str
                    .toLowerCase()
                    .split(" ")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                : null;

        const firstName = capitalizeWords(data.firstName);
        const lastName = capitalizeWords(data.lastName);
        const middleName = capitalizeWords(data.middleName);

        return this.withTransaction(async (conn) => {
            const [result] = await conn.execute<ResultSetHeader>(
                `INSERT INTO users_info (user_id, firstName, lastName, middleName, age) 
             VALUES (?, ?, ?, ?, ?)`,
                [userId, firstName, lastName, middleName, data.age]
            );

            if (result.affectedRows === 0) {
                throw new Error("User information insert failed");
            }
        });
    }


    public async locationCredential(
        data: UserLocation,
        userId: number | undefined
    ): Promise<void> {
        // ✅ Capitalize each word in the string
        const capitalizeWords = (str?: string) =>
            str
                ? str
                    .toLowerCase()
                    .split(" ")
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")
                : null;

        const country = capitalizeWords(data.country);
        const region = capitalizeWords(data.region);
        const district = capitalizeWords(data.district);
        const municipality = capitalizeWords(data.municipality);
        const barangay = capitalizeWords(data.barangay);
        const zone = capitalizeWords(data.zone);
        const houseNumber = capitalizeWords(data.house_number);

        return this.withTransaction(async (conn) => {
            await conn.execute<ResultSetHeader>(
                `INSERT INTO users_location 
             (user_id, country, region, district, municipality, barangay, zone, house_number) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    country,
                    region,
                    district,
                    municipality,
                    barangay,
                    zone,
                    houseNumber
                ]
            );
        });
    }

    public async fetchUserProfile(userID: number) {
        const connection = await mySQLConnectionPool.getConnection()
        try {
            // Fetch the user profile data in MySQL
            const [rows] = await connection.query<RowDataPacket[]>(
                "SELECT * FROM users_profile WHERE user_id = ?",
                [userID]
            )
            if (!rows || rows.length === 0) {
                throw new Error("User profile not found!");
            }
            const profileData = rows[0]
            return profileData as UserProfile
        } catch (error) {
            throw error;
        } finally {
            connection.release()
        }
    }
}