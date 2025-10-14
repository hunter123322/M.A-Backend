import { User } from "../User.type"

export type LikeData = {
    postID: string;
    user: User;
    createdAt?: string;
    updatedAt?: string;
}