import { CommentModel } from "../../model/post/comment.mongo.model";
import type { CommentType } from "../../types/post/comment.type";

export class Comment {
    static async create(commentData: CommentType[]): Promise<void> {
        if (!Array.isArray(commentData) || commentData.length === 0) {
            throw new Error("Invalid comment data");
        }
        try {
            const result = await CommentModel.insertMany(commentData, { ordered: false });
            if (!result || result.length === 0) {
                throw new Error("Failed to create comment(s)");
            }
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

    static async getByPost(postID: string, lastCommentTimestamp?: Date): Promise<CommentType[]> {
        if (!postID) {
            throw new Error("Post ID is required");
        }
        try {
            if (lastCommentTimestamp) {
                const comments: CommentType[] = await CommentModel.find({
                    postID: postID,
                    createdAt: { $gt: new Date(lastCommentTimestamp) }
                }).sort({ createdAt: -1 }).limit(5);
                
                return comments
            }
            const comments: CommentType[] = await CommentModel.find({ postID }).sort({ createdAt: -1 }).limit(5);
            return comments;
        } catch (error: any) {
            throw new Error("Failed to fetch comments");
        }
    }
}
