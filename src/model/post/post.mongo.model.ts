import mongoose, { Schema, Document, Model } from "mongoose";
import type { User } from "../../types/User.type";
import type { PostData } from "../../types/post/post.type";

type PostMongoDoc = PostData & Document & {};

export const userSubSchema = new Schema<User>(
    {
        id: { type: Number, required: true, trim: true },
        username: { type: String, required: true, trim: true },
        avatarUrl: { type: Number, required: true, trim: true },
    },
    { _id: false }
);

export const imageSubSchema = new Schema(
    {
        key: { type: String, required: true },
        mimeType: { type: String, required: true }
    },
    { _id: false }
)

const postSchema = new Schema<PostMongoDoc>(
    {
        author: { type: userSubSchema, required: true },
        imageUrl: { type: imageSubSchema },
        caption: { type: String, trim: true },
        likes: { type: Number, default: 0, min: 0 },
        shared: {
            isSharedPost: { type: Boolean, default: false },
            post: { type: Schema.Types.ObjectId, ref: "Post" },
        },
        type: {
            type: String,
            enum: ["text", "image", "video", "link"],
            default: "text",
            required: true,
        },
        tags: [{ type: String, trim: true }],
        aiScore: { type: Map, of: Number, required: false },
        isEdited: { type: Boolean, default: false },
        mentions: [userSubSchema],
        commentCount: { type: Number, default: 0, min: 0 },
        sharesCount: { type: Number, default: 0, min: 0 },
        visibility: {
            type: String,
            enum: ["public", "friends", "private"],
            default: "public",
            required: true
        }
    },
    { timestamps: true } // adds createdAt & updatedAt automatically
);

export const PostModel: Model<PostMongoDoc> =
    mongoose.models.Post || mongoose.model<PostMongoDoc>("Post", postSchema);

