import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";
import { NotificationService } from "../../service/notification/notification.service";
import type { NotificationType } from "../../types/notificaton/notification.type";
import Post from "../../service/post/post.service";
import { Comment } from "../../service/post/comment.service";

type AuthRequest<T = any, U = any> = Request<{ id?: string }, U, T> & {
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

    static async read(req: AuthRequest<NotificationType>, res: Response) {
        try {
            const data = req.body;

            if (!data?._id) {
                res.status(400).json({ message: "Notification ID is required" });
                return;
            }

            await NotificationService.markAsRead(data._id);

            const { categories, engagementID } = data;
            const postRelated = ["post", "postMention", "like"];
            const commentRelated = ["comment"];

            if (postRelated.includes(categories)) {
                const post = await Post.findById(engagementID);
                res.status(200).json(post);
                return;
            }

            if (commentRelated.includes(categories)) {
                const comment = await Comment.getByID(engagementID);
                if (!comment || !comment.postID) {
                    res.status(404).json({ message: "Comment or linked post not found" });
                    return;
                }

                const post = await Post.findById(comment.postID);
                res.status(200).json({ comment, post });
                return;
            }

            if (categories === "system" || categories === "follow") {
                res.status(200).json({ message: "Notification marked as read" });
                return;
            }

            res.status(400).json({ message: "Unknown notification category" });
        } catch (error) {
            console.error("Error updating notification:", error);
            res.status(500).json({ message: "Failed to update notification" });
        }
    }


    static async markAllAsRead(req: AuthRequest, res: Response) {
        try {
            const notificationID = req.body.ID || ""
            const updated = await NotificationService.markAllAsRead(notificationID);
            res.status(200).json(updated);
        } catch (error) {
            console.error("Error updating many notifications:", error);
            res.status(500).json({ message: "Failed to update notifications" });
        }
    }

    // TODO: Need to refactor that every 2months will delete notification 2months old
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
