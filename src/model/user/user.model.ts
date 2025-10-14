import { IMessageDocument } from "../message/messages.model"
import { Pool, PoolConnection } from 'mysql2/promise';
import { initMessage } from "./user.mongo.model";
import { initUserInfo } from "./user.sql.model";

export class UserModel {
    private connection: Promise<PoolConnection>;

    constructor(mySQLConnection: Pool) {
        this.connection = mySQLConnection.getConnection();
    }

    public async initMessage(userID: number): Promise<IMessageDocument[]> {
        try {
            return initMessage(userID);
        } catch (error) {
            throw error
        }
    }

    public async initUserInfo(userID: number) {
        try {
            return initUserInfo(userID);
        } catch (error) {
            throw error

        }
    }

    public async initUserContact(userID: number) {
        try {
            return
        } catch (error) {
            throw error
            
        }
    }
}
