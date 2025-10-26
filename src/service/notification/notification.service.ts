import mongoDBconnection from "../../db/mongodb/mongodb.connection";
import { NotificationModel } from "../../model/notification/notification.mongo.model";
import { NotificationType } from "../../types/notificaton/notification.type";

export class NotificationService {
    // Create a new notification
    static async create(data: NotificationType) {
        try {
            console.log(data);

            const doc = await NotificationModel.insertOne(data);
            if (!doc) throw new Error("Failed to insert the notification");
            return doc;
        } catch (error) {
            console.log(error);

            throw new Error("Failed to create notification");
        }
    }

    // Delete a notification by ID
    static async delete(ID: string) {
        try {
            const deletedDoc = await NotificationModel.deleteOne({ _id: ID });
            if (deletedDoc.deletedCount === 0)
                throw new Error("Notification not found or failed to delete");
        } catch (error) {
            throw new Error("Error while deleting the notification");
        }
    }

    // Get all notifications for a user
    static async init(userID: number) {
        try {
            const notifications = await NotificationModel.find({ userID })
                .sort({ createdAt: -1 })
                .lean();

            return notifications || [];
        } catch (error) {
            throw new Error("Failed to initialize notifications for user");
        }
    }

    // Get a single notification by ID
    static async get(ID: string) {
        try {
            const notification = await NotificationModel.findById(ID).lean();
            if (!notification) throw new Error("Notification not found");
            return notification as NotificationType;
        } catch (error) {
            throw new Error("Failed to get notification");
        }
    }

    // Update a single notification (e.g., mark as read)
    static async markAsRead(ID: string) {
        try {
            const result = await NotificationModel.updateOne(
                { _id: ID },
                { $set: { read: true } }
            );

            if (result.matchedCount === 0)
                throw new Error("Notification not found to mark as read");

            return result.upsertedId;
        } catch (error) {
            throw new Error("Failed to mark notification as read");
        }
    }

    // Mark all notifications as read for a specific user
    static async markAllAsRead(userID: string) {
        try {
            const result = await NotificationModel.updateMany(
                { userID },
                { $set: { read: true } }
            );

            if (result.matchedCount === 0)
                throw new Error("No notifications found to mark as read");

            return result;
        } catch (error) {
            throw new Error("Failed to mark multiple notifications as read");
        }
    }

}