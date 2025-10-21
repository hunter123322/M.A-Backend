import type { User } from "../User.type";

export type CommentType = {
    _id: string;
    postID: string;
    commentID?: string;
    text: string;
    likes: number;
    author: User;
    mentions?: User[];
    commentCount: number;
    createdAt?: string;
    updatedAt?: string;
};