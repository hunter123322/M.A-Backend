import mongoose from "mongoose";
import { PostModel } from "../../model/post/post.mongo.model";
import type { PostData } from "../../types/post/post.type";
import { Filter } from "./helper/post.helper.service";
import type { User } from "../../types/User.type";
import { blob } from "../../db/blob/blob";
import mongoDBconnection from "../../db/mongodb/mongodb.connection";

type RawPostData = {
    author: User;
    caption: string;
    tags?: string[];
    aiScore?: Object;
    imageUrl?: {
        key: string;
        mimeType: string;
    };
}
class Post {
    static async create(postData: RawPostData, file?: Express.Multer.File) {
        try {
            // Sanitize post input
            postData = Filter.post(postData);

            // If there's an uploaded file
            if (file) {
                // Create unique file key
                const fileKey = `post/${Date.now()}-${postData.author.id}-${file.originalname}`;

                // Convert Node Buffer → ArrayBuffer for Bun's S3Client
                const arrayBuffer = file.buffer.buffer.slice(
                    file.buffer.byteOffset,
                    file.buffer.byteOffset + file.buffer.byteLength
                );

                // Upload file to MinIO
                await blob.write(fileKey, arrayBuffer, {
                    type: file.mimetype,
                    retry: 5
                });

                // Attach image metadata to post data
                postData.imageUrl = {
                    key: fileKey,
                    mimeType: file.mimetype
                };
            }

            // Insert into database
            const postDocument = await PostModel.insertOne(postData);
            if (!postDocument) throw new Error("Posting Error");

            let presignedUrl = '';
            if (postDocument.imageUrl?.key && postDocument.imageUrl?.mimeType) {
                presignedUrl = blob.presign(postDocument.imageUrl.key, {
                    method: "GET",
                    expiresIn: 60 * 60 // 1 hour
                });
                postDocument.imageUrl.key = presignedUrl;

            }

            return postDocument;
        } catch (error) {
            console.error("❌ Post creation failed:", error);
            throw new Error("Error in creating post");
        }
    }

    static async share(postData: RawPostData) {
        try {
            postData = Filter.post(postData)
            const postDocument = await PostModel.insertOne(postData);
            if (!postDocument) throw new Error("Posting Error");
            const populatePostDocument = await postDocument.populate({ path: "shared.post", model: "Post", })
            return populatePostDocument;
        } catch (error) {
            console.error("Error", error);
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

    static async init(userID?: number, category: string[] = []) {
        try {
            /**
             * Post with selected category
             * 
             * Generate an array of conditions for each category dynamically
             * so if the category is empty, skip the fetching for the categoryPosts 
             */
            let categoryPosts: PostData[] = []
            if (category.length !== 0) {
                category = category.map(word => word.toLowerCase());
                const matchConditions = category.map(cat => ({
                    [`aiScore.${cat}`]: { $exists: true, $ne: null }
                }));

                categoryPosts = await PostModel.aggregate([
                    {
                        $match: {
                            $or: matchConditions
                        }
                    },
                    { $sample: { size: 10 } },
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
            }
            /**
             * Post with random category
             * 
             * Calculate how many category posts fetched (must: 10) if not?
             * minus it in 10 (eg. 10 - categoryPosts.length = N)
             * 
             * N is the number how many data should randomPosts will fetched
             */
            const N = 10 - categoryPosts.length
            const randomPosts = await PostModel.aggregate([
                { $sample: { size: N } },
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

            const posts = [...categoryPosts, ...randomPosts]

            // Generate temporary URLs for any image posts
            for (const post of posts) {
                let presignedUrl = '';
                if (post.imageUrl?.key && post.imageUrl?.mimeType) {
                    presignedUrl = blob.presign(post.imageUrl.key, {
                        method: "GET",
                        expiresIn: 60 * 60 // 1 hour
                    });
                }
                post.imageUrl = presignedUrl;
            }

            // Populate the posts if it's shared
            const populated = await PostModel.populate(posts, {
                path: "shared.post",
                model: "Post"
            }) as any[];

            // Generate temporary URLs for any shared posts image
            for (const post of populated) {
                let presignedUrl = '';
                if (post.shared.isSharedPost && post.shared?.post.imageUrl?.key && post.shared?.post.imageUrl?.mimeType) {
                    presignedUrl = blob.presign(post.shared?.post.imageUrl.key, {
                        method: "GET",
                        expiresIn: 60 * 60 // 1 hour
                    });
                    post.shared.post.imageUrl.key = presignedUrl;
                }
            }

            return populated;
        } catch (error) {
            console.error(error);
            throw new Error("Error initializing posts with like/share aggregation");
        }
    }



    static async findById(postId: string, userID?: number) {
        try {
            const postObjectId = new mongoose.Types.ObjectId(postId);

            const postDocuments = await PostModel.aggregate([
                {
                    $match: { _id: postObjectId },
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
                                            ...(userID ? [{ $eq: ["$user.id", userID] }] : []),
                                        ],
                                    },
                                },
                            },
                        ],
                        as: "userLike",
                    },
                },
                {
                    $addFields: {
                        isLiked: { $gt: [{ $size: "$userLike" }, 0] },
                    },
                },
                {
                    $project: {
                        userLike: 0,
                    },
                },
            ]);

            if (!postDocuments.length) throw new Error("Post not found");

            // ✅ Populate related post for shared posts
            const populatedPost = await PostModel.populate(postDocuments, {
                path: "shared.post",
                model: "Post",
            });

            return populatedPost;
        } catch (error) {
            console.error(error);
            throw new Error("Error fetching post by ID");
        }
    }

    static async findByTimestamp(timestamp: Date, userID: number) {
        try {
            const posts = await PostModel.aggregate([
                {
                    $match: {
                        "author.id": userID,
                        createdAt: { $gte: timestamp }
                    }
                },
                { $sort: { createdAt: -1 } },
                { $limit: 10 },
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
                    $project: { userLike: 0 }
                },
            ]);

            // Generate temporary URLs for any image posts
            for (const post of posts) {
                let presignedUrl = '';
                if (post.imageUrl?.key && post.imageUrl?.mimeType) {
                    presignedUrl = blob.presign(post.imageUrl.key, {
                        method: "GET",
                        expiresIn: 60 * 60 // 1 hour
                    });
                }
                post.imageUrl = presignedUrl;
            }

            // Populate the posts if it's shared
            const populated = await PostModel.populate(posts, {
                path: "shared.post",
                model: "Post"
            }) as any[];

            // Generate temporary URLs for any shared posts image
            for (const post of populated) {
                let presignedUrl = '';
                if (post.shared?.post.imageUrl?.key && post.shared?.post.imageUrl?.mimeType) {
                    presignedUrl = blob.presign(post.shared?.post.imageUrl.key, {
                        method: "GET",
                        expiresIn: 60 * 60 // 1 hour
                    });
                }
                post.imageUrl = presignedUrl;
            }

            return populated;
        } catch (error) {
            throw new Error("Error in fetching posts by timestamp");
        }
    }

    static async findByUser(userID: number) {
        try {
            const posts = await PostModel.aggregate([
                { $match: { "author.id": userID } },
                { $sort: { createdAt: -1 } },
                { $limit: 10 },
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
                    $project: { userLike: 0 }
                }
            ]);

            // Generate temporary URLs for any image posts
            for (const post of posts) {
                let presignedUrl = '';
                if (post.imageUrl?.key && post.imageUrl?.mimeType) {
                    presignedUrl = blob.presign(post.imageUrl.key, {
                        method: "GET",
                        expiresIn: 60 * 60 // 1 hour
                    });
                }
                post.imageUrl = presignedUrl;
            }

            // Populate the posts if it's shared
            const populated = await PostModel.populate(posts, {
                path: "shared.post",
                model: "Post"
            }) as any[];

            // Generate temporary URLs for any shared posts image
            for (const post of populated) {
                let presignedUrl = '';
                if (post.shared.isSharedPost && post.shared?.post.imageUrl?.key && post.shared?.post.imageUrl?.mimeType) {
                    presignedUrl = blob.presign(post.shared?.post.imageUrl.key, {
                        method: "GET",
                        expiresIn: 60 * 60 // 1 hour
                    });
                    post.shared.post.imageUrl.key = presignedUrl;
                }
            }

            return populated as PostData[];
        } catch (error) {
            console.error("❌ Error fetching posts by user:", error);
            throw new Error("Error fetching posts by user");
        }
    }
}

export default Post;
