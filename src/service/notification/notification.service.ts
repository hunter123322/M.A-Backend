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
    static async updateOne(ID: string, updateData: Partial<NotificationType>) {
        try {
            const result = await NotificationModel.updateOne(
                { _id: ID },
                { $set: updateData }
            );

            if (result.matchedCount === 0)
                throw new Error("Notification not found to update");

            return result;
        } catch (error) {
            throw new Error("Failed to update notification");
        }
    }

    // Update multiple notifications (e.g., mark all read for a user)
    static async updateMany(filter: Record<string, any>, updateData: Partial<NotificationType>) {
        try {
            const result = await NotificationModel.updateMany(
                filter,
                { $set: updateData }
            );

            if (result.matchedCount === 0)
                throw new Error("No notifications found to update");

            return result;
        } catch (error) {
            throw new Error("Failed to update multiple notifications");
        }
    }
}