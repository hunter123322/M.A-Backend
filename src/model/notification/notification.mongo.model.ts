import mongoose, { Schema, Document, Model } from "mongoose";
import type { NotificationType } from "../../types/notificaton/notification.type";
import { userSubSchema } from "../post/post.mongo.model";

type NotificationDoc = NotificationType & Document;

const notificationSchema = new Schema<NotificationDoc>(
    {
        userID: { type: Number, required: true, index: true },
        engagementID: { type: String, required: true },
        actor: { type: userSubSchema, required: true },
        categories: {
            type: String,
            enum: ["comment", "post", "mention", "like", "follow", "system"],
            default: "system", required: true,
        },
        content: { type: String, trim: true },
        read: { type: Boolean, default: false, index: true }
    },
    {
        timestamps: true,
    }
);

export const NotificationModel: Model<NotificationDoc> =
    mongoose.models.Notification || mongoose.model<NotificationDoc>(
        "Notification", notificationSchema
    );
