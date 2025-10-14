import { ContactList } from "../../types/contact.list.type";
import { Contact } from "../contact/contact.list.model";
import { Message } from "../message/messages.model";
import type { IMessageDocument } from "../message/messages.model"
import { ConversationList } from "../conversation/conversation.model";
import { Conversation } from "../../types/conversation.list.type";


export async function initMessage(user_id: number): Promise<IMessageDocument[]> {
    try {
        const message = Message.find({
            $or: [{ senderID: user_id }, { receiverID: user_id }]
        }).sort({ createdAt: -1 }).limit(40);

        return message
    } catch (error) {
        throw new Error("Fail to initialize the message!");
    }
}

export async function initUserContact(userID: number): Promise<ContactList> {
    try {
        const contact = await Contact.findOne({ userID: userID });
        return contact as ContactList;
    } catch (error) {
        throw new Error("Cant get the contact");
    }
}

export async function initUserConversation(conversationID: string[]): Promise<Conversation[]> {
    try {
        return await ConversationList.find({ contactID: { $in: conversationID } });
    } catch (error) {
        throw new Error("Error fetching conversations");
    }
}

