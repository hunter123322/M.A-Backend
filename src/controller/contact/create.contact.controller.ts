import e, { Request, Response } from "express";
import mongoDBconnection from "../../db/mongodb/mongodb.connection";
import { ConversationList } from "../../model/conversation/conversation.model";
import { Contact } from "../../model/contact/contact.list.model";
import type { Participant } from "../../types/conversation.list.type";
import type { JWTPayload } from "../../types/jtw.payload.type.js";
import { initUserInfo } from "../../model/user/user.sql.model";
import { UserInfo } from "../../types/User.type";

type ContactQuery = {
    participant: Participant,
    contactID: string
}



type AuthRequest<T = any> = Request<unknown, unknown, T> & {
    user?: JWTPayload;
};

function conversationIDSorter(senderID: string, receiverID: string) {
    const sort = senderID < receiverID ? [senderID, receiverID] : [receiverID, senderID]
    const newContactID = `conv${sort[0]}_${sort[1]}`
    return newContactID;
}

export async function createContact(req: AuthRequest, res: Response) {
    try {
        let query: ContactQuery = req.body as any;

        const user_id = (req.user?.user_id)?.toString();
        if (!user_id) throw new Error("user id required")


        let receiver: Participant = query.participant
        if (!receiver?.userID) throw new Error("receiver id required")
        receiver.userID = receiver.userID

        const users_info: UserInfo = await initUserInfo(+user_id)
        if (!users_info) throw new Error("Failed");
        const sender: Participant = {
            userID: users_info.user_id as number,
            firstName: users_info.firstName,
            lastName: users_info.lastName,
            nickname: "",
            mute: false
        }

        const newConversationID = conversationIDSorter(user_id, receiver.userID.toString())


        if (!query) {
            console.log("Empty query");
            throw new Error("Try again");
        }
        console.log({
            participant: [sender, receiver], // must be array
            contactID: newConversationID
        });;


        // Create Conversation 
        const createConversation = await ConversationList.create({
            participant: [sender, receiver], // must be array
            contactID: newConversationID
        });



        if (!createConversation) {
            throw new Error("Failed to create Conversation!");
        }

        // Add to the ContactList in mongoDB
        const addContact = await Contact.findOneAndUpdate(
            { userID: user_id },
            { $push: { conversationID: createConversation._id } },
            { new: true }
        );

        // Add to the ContactList of receiver in mongoDB
        const addReceiverContact = await Contact.findOneAndUpdate(
            { userID: receiver.userID },
            { $push: { conversationID: createConversation._id } },
            { new: true, upsert: true }
        );

        if (!addContact || !addReceiverContact) {
            throw new Error("Failed to create Contact!");
        }

        res.status(201).json({
            message: "Contact created successfully!",
            contact: addContact,
            conversation: createConversation
        });

    } catch (error) {
        console.error('The Error: ' + error);

        // normalize error message (could be string or Error object)
        const message = error instanceof Error ? error.message : "Server error";

        res.status(500).json({
            message,
            error: process.env.NODE_ENV === "development" ? error : "Failed to Create conversation"
        });
    }
}

