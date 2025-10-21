import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";
import { CommentType } from "../../types/post/comment.type";
import { Comment } from "../../service/post/comment.service";
import { PostModel } from "../../model/post/post.mongo.model";

type AuthRequest<T = any> = Request<any, any, T> & {
    user?: JWTPayload;
};

type LoadMoreComment = CommentType & {
    lastCommentTimestamp: Date
}

export class CommentController {
    static async get(req: AuthRequest<CommentType>, res: Response) {
        try {
            const postID = req.query.postID as string;
            if (!postID) throw new Error("Post comment invalid!")

            const comments = await Comment.getByPost(postID)
            res.status(200).json(comments)
        } catch (error: any) {
            if (error) console.log(error.message);
            res.status(500)
        }
    }
    static async loadMoreComment(req: AuthRequest<LoadMoreComment>, res: Response) {
        try {

            const postID = req.query.postID as string;
            const lastCommentTimestamp = req.query.lastCommentTimestamp as string;
            if (!postID) throw new Error("Post comment invalid!");

            const comment = await Comment.getByPost(postID, lastCommentTimestamp);

            res.status(200).json(comment);
        } catch (error: any) {
            res.status(500).json({ message: error.message })
        }
    }
    static async create(req: AuthRequest<CommentType>, res: Response) {
        try {
            const commentData = req.body;
            const data = await Comment.create(commentData);

            res.status(201).json({ comment: data });
        } catch (error: any) {
            console.error("Error creating comment:", error);
            res.status(500).json({ error: "Comment error" });
        }
    }

    static async delete(req: AuthRequest<CommentType>, res: Response) {
        try {
            const comment_id = req.body._id;
            const userID = req.body.author.id;

            Comment.delete(comment_id, userID)

            res.status(201)
        } catch (error: any) {
            res.status(500).json({ error: "Comment error" })
        }
    }

}