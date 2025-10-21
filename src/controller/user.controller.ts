import { UserTransaction } from "../service/user/user.service";
import passwordController from "../service/auth/password.service";
import mySQLConnectionPool from "../db/mysql/mysql.connection-pool";
import userSignupValidation from "../validation/user.signup.validation";
import { UserModel } from "../model/user/user.model";
import { IMessageDocument } from "../model/message/messages.model";
import type { UserInfo, UserLocation, UserAut } from "../types/User.type";
import { Contact } from "../model/contact/contact.list.model";
import { ConversationList } from "../model/conversation/conversation.model";
import Post from "../service/post/post.service";

const user = new UserModel(mySQLConnectionPool);

type SQLConn = typeof mySQLConnectionPool;

export type UserAuthFull = UserAut & UserInfo;

type ApiResponse = {
  user_id: number;
  messages: IMessageDocument[];
  authentication: UserAuthFull;
}

export class UserController {
  private transaction: UserTransaction;

  constructor(private SQLconnection: SQLConn) {
    this.transaction = new UserTransaction(this.SQLconnection);
  }

  public async signController(email: string, password: string, username: string): Promise<number> {
    const hashedPassword = await passwordController.passwordHasher(password);
    return this.transaction.signupCredential(email, hashedPassword, username);
  }

  public async userInformationController(data: UserInfo, user_id: number | undefined): Promise<void> {
    if (!userSignupValidation.userValidation(data)) {
      throw new Error();
    }
    await this.transaction.informationCredential(data, user_id);
  }

  public async locationController(data: UserLocation, user_id: number | undefined): Promise<void> {
    if (!userSignupValidation.locationValidation(data)) {
      throw new Error();
    }
    await this.transaction.locationCredential(data, user_id);
  }

  public async initProfile(userID: number) {
    const userProfileData = await this.transaction.fetchUserProfile(userID);

    // Fetch the user post data in MongoDB
    const myPosts = await Post.findByUser(userID)

    return {userProfileData, myPosts}
  }

  public async loginController(data: UserAut): Promise<ApiResponse> {
    const authentication = await passwordController.compareEncryptedPassword(data.email, data.password);
    if (!authentication) {
      throw new Error("Invalid Login!");
    }
    const initMessage = await user.initMessage(authentication.user_id as number);

    return {
      user_id: authentication.user_id as number,
      messages: initMessage,
      authentication,
    };
  }
}


