import { PostModel } from "../../model/post/post.mongo.model";
import type { PostData } from "../../types/post/post.type";
import { Filter } from "./helper/post.helper.service";

class Post {
    static async create(postData: PostData) {
        try {
            postData = Filter.post(postData)
            const postDocument = await PostModel.insertOne(postData);
            if (!postDocument) throw new Error("Posting Error");
            return postDocument;
        } catch (error) {
            throw new Error("Error in creating post");
        }
    }

    static async share(postData: PostData) {
        try {
            postData = Filter.post(postData)
            const postDocument = await PostModel.insertOne(postData);
            if (!postDocument) throw new Error("Posting Error");
            const populatePostDocument = await postDocument.populate({ path: "shared.post", model: "Post", })
            return populatePostDocument;
        } catch (error) {
            throw new Error("Error in creating post");
        }
    }

    static async update(postId: string, postData: Partial<PostData>) {
        try {
            const postDocument = await PostModel.findByIdAndUpdate(postId, postData, { new: true });
            if (!postDocument) throw new Error("Post not found");
            return postDocument;
        } catch (error) {
            throw new Error("Error in updating post");
        }
    }

    static async delete(postId: string) {
        try {
            const postDocument = await PostModel.findByIdAndDelete(postId);
            if (!postDocument) throw new Error("Post not found");
            return postDocument;
        } catch (error) {
            throw new Error("Error in deleting post");
        }
    }

    static async findById(postId: string) {
        try {
            const postDocument = await PostModel.findById(postId);
            if (!postDocument) throw new Error("Post not found");
            return postDocument;
        } catch (error) {
            throw new Error("Error in fetching post by ID");
        }
    }

    static async findByTimestamp(timestamp: Date) {
        try {
            const postDocuments = await PostModel.find({
                createdAt: { $gte: timestamp },
            }).sort({ createdAt: -1 });

            return postDocuments;
        } catch (error) {
            throw new Error("Error in fetching posts by timestamp");
        }
    }

    static async findByUser(userID: number) {
        try {
            const posts = await PostModel.aggregate([
                {
                    $match: { "author.id": userID }
                },
                {
                    $sort: { createdAt: -1 }
                },
                {
                    $lookup: {
                        from: "likes",
                        let: { postIdStr: { $toString: "$_id" } },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ["$postID", "$$postIdStr"] },
                                            { $eq: ["$user.id", userID] }
                                        ]
                                    }
                                }
                            }
                        ],
                        as: "userLike"
                    }
                },
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: "$userLike" }, 0] }
                    }
                },
                {
                    $project: {
                        userLike: 0
                    }
                }
            ]);

            const populated = await PostModel.populate(posts, {
                path: "shared.post",
                model: "Post"
            });
            console.log(populated);


            return populated;
        } catch (error) {
            console.error(error);
            throw new Error("Error fetching posts by user");
        }
    }
}

export default Post;
