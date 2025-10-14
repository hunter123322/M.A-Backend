import { PostModel } from "../../model/post/post.mongo.model";
import type { PostData } from "../../types/post/post.type";
import { Filter } from "./helper/post.helper.service";

class Post {
    static async create(postData: PostData[]) {
        try {
            let postWithFilterData: PostData[] = [];
            postData.forEach(e => {
                postWithFilterData.push(Filter.post(e));
            });

            const postDocument = await PostModel.insertMany(postWithFilterData, { ordered: false });
            if (!postDocument) throw new Error("Posting Error");
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
}

export default Post;
