import mongoose, { Schema, Document, Model } from "mongoose"
import type { CommentType } from "../../types/post/comment.type"
import { userSubSchema } from "./post.mongo.model";

type CommentMongoDoc = CommentType & Document & {}

const commentSchema = new Schema<CommentMongoDoc>({
    postID: { type: String, required: true, index: true },       // optional string
    commentID: { type: String, required: false },    // optional string
    text: { type: String, required: true },          // required string
    likes: { type: Number, required: true, default: 0 },  // number with default 0
    author: { type: userSubSchema, required: true },    // embedded user document (or you can use ref)
    commentCount: { type: Number, required: true, default: 0 },
    mentions: { type: [userSubSchema], required: false, default: [] } // array of users mentioned
}, { timestamps: true, versionKey: false });

export const CommentModel: Model<CommentMongoDoc> =
    mongoose.models.Comment || mongoose.model<CommentMongoDoc>("Comment", commentSchema);