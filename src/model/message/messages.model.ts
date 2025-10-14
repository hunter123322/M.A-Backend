import mongoose, { Schema, Document, Model } from "mongoose";
import { IReaction } from "../../types/message.type";
import type { IMessage } from "../../types/message.type";
import type { User } from "../../types/User.type";




const reactionSchema = new Schema<IReaction>({
  userID: { type: Number, required: true },
  emoji: { type: String }
}, { _id: false });

export interface IMessageDocument extends IMessage, Document {
  reaction: typeof reactionSchema,
}

const userSubSchema = new Schema<User>(
  {
    id: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    avatarUrl: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessageDocument>(
  {
    senderID: { type: Number, required: true },
    receiverID: { type: Number, required: true },
    conversationID: { type: String, required: true, index: true },
    content: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["text", "image", "video", "file", "audio"],
      default: "text",
    },
    reactions: [{
      userID: { type: String, required: true },
      emoji: { type: String },
    }],
    status: {
      type: String,
      enum: ["sent", "sending", "delivered", "seen", "invalid"],
      default: "sent",
    },
    hide: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    collection: "messages"
  }
);

const messageSchemaV2 = new Schema(
  {
    senderID: { type: userSubSchema, required: true, index: true },
    receiverID: { type: userSubSchema, required: true, index: true },
    conversationID: { type: String, required: true },
    content: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["text", "image", "video", "file", "audio"],
      default: "text",
    },
    reactions: [{
      userID: { type: userSubSchema, required: true },
      emoji: { type: String },
    }],
    status: {
      type: String,
      enum: ["sent", "sending", "delivered", "seen", "invalid"],
      default: "sent",
    },
    hide: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    collection: "messages"
  }
);

export const Message: Model<IMessageDocument> =
  mongoose.model<IMessageDocument>("Message", messageSchema);

export const MessageV2: Model<IMessageDocument> =
  mongoose.model<IMessageDocument>("MessageV2", messageSchemaV2);