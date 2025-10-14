import { Message } from "../../model/message/messages.model";
import { randomUUID } from "crypto";
import { MessageDataType, IReaction } from "../../types/message.type";

type QueryData = {
    conversationID?: string,
    createdAt?: {
        $lt?: Date,
        $gt?: Date
    }
}

export async function getMessage(convoID: string, lastTimestamp: any): Promise<any[]> {
    try {
        let query: QueryData = {
            createdAt: { $gt: new Date(lastTimestamp) }
        };

        if (!lastTimestamp) {
            query = { conversationID: convoID }
        }

        console.log(query);
        const messages = await Message.find(query).limit(100)

        if (!messages || messages.length === 0) {
            throw new Error("No messages found");
        }

        return messages;
    } catch (error: any) {
        console.error("Database error:", error);
        throw new Error("Failed to retrieve messages: " + error.message);
    }
}


export async function postMessage(
    content: string,
    sender: number,
    reciever: number,
    reactions: Array<IReaction>,
    conversationId?: String
): Promise<MessageDataType> {
    try {
        if (!conversationId) {
            const lastconversationID = randomUUID();
            conversationId = lastconversationID.toString();
        }

        const newMessage = new Message({
            senderID: sender,
            receiverID: reciever,
            conversationID: conversationId,
            reactions: reactions,
            content: content
        });

        const saveMessage: MessageDataType = await newMessage.save();
        if (!saveMessage) throw new Error("Failed to send!");
        return saveMessage;
    } catch (error: any) {
        throw new Error("Post message Error!");
    }
}
