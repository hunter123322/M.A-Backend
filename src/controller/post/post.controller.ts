import { Request, Response } from "express";
import type { JWTPayload } from "../../types/jtw.payload.type";
import type { PostData } from "../../types/post/post.type";
import Post from "../../service/post/post.service";

type AuthRequest<T = any> = Request<{ id: string }, unknown, T> & {
    user?: JWTPayload;
};

export class PostController {
    static async getById(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { id } = req.params; // expects /posts/:id

            if (!id) {
                res.status(400).json({ message: "Post ID is required" });
                return;
            }

            const post = await Post.findById(id);
            if (!post) {
                res.status(404).json({ message: "Post not found" });
                return;
            }

            res.status(200).json({ data: post });
        } catch (error: any) {
            console.error("❌ Get Post Error:", error);
            res.status(500).json({ message: "Failed to get post" });
        }
    }

    static async getByTimestamp(req: AuthRequest, res: Response): Promise<void> {
        try {
            const { since } = req.query; // expects /posts/timestamp?since=...

            if (!since) {
                res.status(400).json({ message: "Timestamp query 'since' is required" });
                return;
            }

            const timestamp = new Date(since as string);
            if (isNaN(timestamp.getTime())) {
                res.status(400).json({ message: "Invalid timestamp format" });
                return;
            }

            const posts = await Post.findByTimestamp(timestamp, 1);
            res.status(200).json({ data: posts });
        } catch (error: any) {
            console.error("❌ Get Posts by Timestamp Error:", error);
            res.status(500).json({ message: "Failed to get posts by timestamp" });
        }
    }

    static async create(req: AuthRequest, res: Response): Promise<void> {
        try {
            const file = req.file;
            const { author, caption } = req.body

            const postData = {
                author: JSON.parse(author),
                caption: caption
            }

            if (!file) {
                res.status(400).json({ message: "No file uploaded" });
                return
            }

            if (!postData) {
                res.status(400).json({ message: "Invalid post data" });
                return;
            }

            const postDone = await Post.create(postData, file);
            res.status(201).json(postDone);
        } catch (error: any) {
            res.status(500).json({ message: "Failed to create post" });
        }
    }

    static async share(req: AuthRequest, res: Response): Promise<void> {
        try {
            const postData = req.body;

            if (!postData) {
                res.status(400).json({ message: "Invalid post data" });
                return;
            }

            const postDone = await Post.share(postData);
            res.status(201).json(postDone);
        } catch (error: any) {
            console.error("Error", error);
            res.status(500).json({ message: "Failed to create post" });
        }
    }

    static async update(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user_id = req.user?.user_id;
            const { postID, updateData } = req.body as { postID: string; updateData: Partial<PostData> };

            if (!user_id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            if (!postID || !updateData || Object.keys(updateData).length === 0) {
                res.status(400).json({ message: "Invalid update data" });
                return;
            }

            const updatedPost = await Post.update(postID, updateData);
            if (!updatedPost) {
                res.status(404).json({ message: "Post not found or unauthorized" });
                return;
            }

            res.status(200).json({ message: "Post updated successfully", data: updatedPost });
        } catch (error: any) {
            console.error("❌ Post Update Error:", error);
            res.status(500).json({ message: "Failed to update post" });
        }
    }

    static async delete(req: AuthRequest, res: Response): Promise<void> {
        try {
            const user_id = req.user?.user_id;
            const { postID } = req.body as { postID: string };

            if (!user_id) {
                res.status(401).json({ message: "Unauthorized" });
                return;
            }

            if (!postID) {
                res.status(400).json({ message: "Post ID required" });
                return;
            }

            const deleted = await Post.delete(postID);
            if (!deleted) {
                res.status(404).json({ message: "Post not found or unauthorized" });
                return;
            }

            res.status(200).json({ message: "Post deleted successfully" });
        } catch (error: any) {
            console.error("❌ Post Deletion Error:", error);
            res.status(500).json({ message: "Failed to delete post" });
        }
    }

    static async feedInit(req: AuthRequest, res: Response) {
        try {
            const id = req.query.id;
            const category = req.query.categories as string
            const categories = category.slice(1, -1).split(',') as any

            console.log(req.query, categories);
            
            const post = await Post.init(Number(id), categories);
            if (!post || post.length === 0) {
                res.status(400).json({ message: "Retry" })
                return
            }
            res.status(200).json(post)
        } catch (error) {
            res.status(500).json({ message: "something went wrong" })
        }
    }

    static async findByUser(req: AuthRequest, res: Response) {
        try {
            const userID = req.query.id as string
            if (!userID) {
                res.status(400).json({ message: "User ID is empty" });
                return
            }
            const posts = await Post.findByUser(Number(userID))

            res.status(200).json(posts)
        } catch (error) {
            res.status(500).json({ message: "something went wrong" })
        }
    }
}
