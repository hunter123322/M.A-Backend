import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";
import { NotificationService } from "../../service/notification/notification.service";
import type { NotificationType } from "../../types/notificaton/notification.type";

type AuthRequest<T = any> = Request<{ id?: string }, unknown, T> & {
    user?: JWTPayload;
};

export class NotificationController {
    static async create(req: AuthRequest<NotificationType>, res: Response) {
        try {
            const userID = req.user?.user_id;
            if (!userID) {
                res.status(401).json({ message: "Unauthorized" });
                return
            }

            const data = req.body as NotificationType;
            if (!data) {
                res.status(400).json({ message: "Invalid notification data" });
                return
            }

            const doc = await NotificationService.create({ ...data, userID });
            res.status(201).json(doc);
        } catch (error) {
            console.error("Error creating notification:", error);
            res.status(500).json({ message: "Failed to create notification" });
        }
    }

    static async init(req: AuthRequest, res: Response) {
        try {
            const userID = req.user?.user_id;
            if (!userID) {
                res.status(401).json({ message: "Unauthorized" });
                return
            }

            const notifications = await NotificationService.init(userID);
            res.status(200).json(notifications);
        } catch (error) {
            console.error("Error fetching notifications:", error);
            res.status(500).json({ message: "Failed to fetch notifications" });
        }
    }

    static async updateOne(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            const updates = req.body;
            if (!id) {
                res.status(400).json({ message: "Missing notification ID" });
                return
            }

            const updated = await NotificationService.updateOne(id, updates);
            res.status(200).json(updated);
        } catch (error) {
            console.error("Error updating notification:", error);
            res.status(500).json({ message: "Failed to update notification" });
        }
    }

    static async updateMany(req: AuthRequest, res: Response) {
        try {
            const filter = req.body.filter || {};
            const updates = req.body.updates || {};
            const updated = await NotificationService.updateMany(filter, updates);
            res.status(200).json(updated);
        } catch (error) {
            console.error("Error updating many notifications:", error);
            res.status(500).json({ message: "Failed to update notifications" });
        }
    }

    static async delete(req: AuthRequest, res: Response) {
        try {
            const { id } = req.params;
            if (!id) {
                res.status(400).json({ message: "Missing notification ID" });
                return
            }

            await NotificationService.delete(id);
            res.status(200).json({ message: "Notification deleted successfully" });
        } catch (error) {
            console.error("Error deleting notification:", error);
            res.status(500).json({ message: "Failed to delete notification" });
        }
    }
}
