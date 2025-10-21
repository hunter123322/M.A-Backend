import { User } from "../User.type";

export type NotificationType = {
    _id?: string;
    userID: number;
    engagementID: string
    categories: "post" | "mention" | "like" | "follow" | "comment" | "system";
    content: string;
    read: boolean;
    actor?: User
    createdAt?: string;
    updatedAt?: string;
}