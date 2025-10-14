import mongoose, { Schema, Document, Model } from "mongoose";
import { LikeData } from "../../types/post/like.type";
import { userSubSchema } from "./post.mongo.model";

type LikeMongoDoc = LikeData & Document & {}

const likeSchema = new Schema<LikeMongoDoc>({
    user: { type: userSubSchema, required: true },
    postID: { type: String, required: true, index: true }
}, { timestamps: true, _id: false, versionKey: false });

export const LikeModel: Model<LikeMongoDoc> =
    mongoose.models.Like || mongoose.model<LikeMongoDoc>("Like", likeSchema);





    