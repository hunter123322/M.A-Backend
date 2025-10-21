import { io } from "../../app";
import { CommentModel } from "../../model/post/comment.mongo.model";
import { PostModel } from "../../model/post/post.mongo.model";
import { sendNotification } from "../../socket/event/message.event";
import type { CommentType } from "../../types/post/comment.type";
import { NotificationService } from "../notification/notification.service";
export class Comment {
    static async create(commentData: CommentType): Promise<CommentType | undefined> {
        try {
            if (!commentData) throw new Error("Retry the comment!")
            const data = await CommentModel.insertOne(commentData);
            if (!data) {
                throw new Error("Failed to create comment(s)");
            }

            // Increment commentCount by 1
            const updatedPostDOc = await PostModel.findByIdAndUpdate(
                data.postID, { $inc: { commentCount: 1 } }, { new: true }
            );
            if (!updatedPostDOc || !updatedPostDOc.author || !updatedPostDOc.author.id) {
                throw new Error("Updated post not found or missing author — skipping notification");
            }
            if (updatedPostDOc.author.id === commentData.author.id) {
                console.info("User liked their own post — skipping notification");
                return;
            }

            const notificationData = {
                userID: updatedPostDOc.author.id,
                engagementID: updatedPostDOc._id,
                categories: "like" as "like",
                content: "",
                read: false
            };

            const newNotification = await NotificationService.create(notificationData);

            sendNotification(io, notificationData.userID, newNotification)
        } catch (error: any) {
            throw new Error("Failed to create comment(s)");
        }
    }

    static async delete(commentID: string, userID: number): Promise<void> {
        if (!commentID || !userID) {
            throw new Error("Invalid delete parameters");
        }
        try {
            const result = await CommentModel.deleteOne({ _id: commentID, "user.userID": userID });
            if (result.deletedCount === 0) {
                throw new Error("Comment not found or unauthorized");
            }
        } catch (error: any) {
            throw new Error("Failed to delete comment");
        }
    }

    static async getByPost(postID: string, lastCommentTimestamp?: string): Promise<CommentType[]> {
        if (!postID) {
            throw new Error("Post ID is required");
        }

        try {
            const query: any = { postID };

            if (lastCommentTimestamp) {
                query.createdAt = { $lt: new Date(lastCommentTimestamp) }; // ✅ older than the last loaded
            }

            const comments: CommentType[] = await CommentModel.find(query)
                .sort({ createdAt: -1 }) // newest first
                .limit(5);

            console.log(comments);
            return comments;
        } catch (error: any) {
            console.error("Error in getByPost:", error);
            throw new Error("Failed to fetch comments");
        }
    }

}
