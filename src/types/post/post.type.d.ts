import { User } from "../User.type";

export type PostData = {
    _id?: string;
    author: User;
    imageUrl?: {
        key: string;
        mimeType: string;
    };
    caption: string;
    type: "text" | "image" | "video" | "link";
    likes: number;
    shared?: {
        isSharedPost: boolean;
        post: string;
    };
    tags?: string[];
    aiScore?: Record<string, number>;
    mentions?: User[];
    commentCount?: number;
    sharesCount?: number;
    visibility?: "public" | "friends" | "private";
    isEdited: boolean;
    createdAt?: string;
    updatedAt?: string;
};
