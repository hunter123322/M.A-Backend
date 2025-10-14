import mongoose, { Schema, Model } from "mongoose";
import type { Conversation, Participant } from "../../types/conversation.list.type";

const Participant = new Schema<Participant>({
    userID: { type: Number, required: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    nickname: { type: String, trim: true },
    mute: { type: Boolean, required: true }
}, { _id: false, versionKey: false });

const ConversationSchema = new Schema<Conversation>({
    participant: [Participant],
    contactID: { type: String, required: true, trim: true },
},
    {
        timestamps: true,
        versionKey: false,
        collection: "conversationList"
    }
);

export const ConversationList: Model<Conversation> = mongoose.models.ConversationList ||
    mongoose.model<Conversation>("Conversation", ConversationSchema)