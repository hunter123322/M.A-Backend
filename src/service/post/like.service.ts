import { LikeModel } from "../../model/post/like.mongo.model";
import type { LikeData } from "../../types/post/like.type";

export class Like {
    static async like(likeData: LikeData[]): Promise<void> {
        if (!Array.isArray(likeData) || likeData.length === 0) {
            throw new Error("Invalid like data");
        }
        try {
            const result = await LikeModel.insertMany(likeData, { ordered: false });
            if (!result || result.length === 0) {
                throw new Error("Failed to insert like");
            }
        } catch (error: any) {
            throw new Error("Failed to like the post");
        }
    }

    static async unlike(likeData: LikeData[]): Promise<void> {
        if (!likeData || likeData.length === 0) {
            throw new Error("Invalid unlike parameters");
        }
        try {
            const conditions = likeData.map(({ user, postID }) => ({
                "user.userID": user,
                postID: postID
            }));

            const result = await LikeModel.deleteMany({
                $or: conditions
            });

            if (result.deletedCount === 0) {
                throw new Error("No likes found or already unliked");
            }
        } catch (error: any) {
            throw new Error("Failed to unlike the post");
        }
    }

}
