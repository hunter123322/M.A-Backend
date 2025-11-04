import { LikeModel } from "../../model/post/like.mongo.model";
import { PostModel } from "../../model/post/post.mongo.model";
import type { LikeData } from "../../types/post/like.type";
import { NotificationService } from "../notification/notification.service";
import type { User } from "../../types/User.type";
import axios from "axios"

export class Like {
    static async like(likeData: LikeData, author?: User): Promise<void> {
        if (!likeData) {
            throw new Error("Invalid like data");
        }
        try {

            const result = await LikeModel.insertOne(likeData);
            if (!result) {
                throw new Error("Failed to insert like");
            }

            const updatedPostDOc = await PostModel.findByIdAndUpdate(result.postID, { $inc: { likes: 1 } }, { new: true });
            if (!updatedPostDOc || !updatedPostDOc.author || !updatedPostDOc.author.id) {
                throw new Error("Updated post not found or missing author — skipping notification");
            }

            // if (updatedPostDOc.author.id === likeData.user.id) {
            //     console.info("User liked their own post — skipping notification");
            //     return;
            // }

            const notificationData = {
                userID: updatedPostDOc.author.id,
                engagementID: updatedPostDOc._id.toString(),
                categories: "like" as "like",
                content: "",
                read: false,
                actor: author
            };
            const newNotification = await NotificationService.create(notificationData);
            // TODO Emit using the sooket

            await axios.post("http://localhost:3001/internal/notify",
                { notificationData, newNotification },
                {
                    headers: {
                        "x-api-key": process.env.INTERNAL_API_KEY,
                    },
                }
            );
        } catch (error: any) {
            console.log(error);
            throw new Error("Failed to like the post");
        }
    }

    static async unlike(likeData: LikeData): Promise<void> {
        if (!likeData || !likeData.user || !likeData.postID) {
            throw new Error("Invalid unlike parameters");
        }

        try {
            const result = await LikeModel.deleteOne({
                "user.id": likeData.user.id,
                postID: likeData.postID
            });

            if (result.deletedCount > 0) {
                await PostModel.updateOne(
                    { _id: likeData.postID },
                    { $inc: { likes: -1 } }
                );
            } else {
                console.warn("No like found — skipping decrement");
            }

            await PostModel.updateOne(
                { _id: likeData.postID, likes: { $gt: 0 } },
                { $inc: { likes: -1 } }
            );

        } catch (error: any) {
            console.error(error);
            throw new Error("Failed to unlike the post");
        }
    }

}