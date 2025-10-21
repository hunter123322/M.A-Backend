import { Server, Socket } from "socket.io";
import { getMessage, postMessage } from "../../service/message/message.socket.service";
import { Message } from "../../model/message/messages.model";
import type { MessageDataType } from "../../types/message.type";
import type { IMessage } from "../../types/message.type";
import { NotificationType } from "../../types/notificaton/notification.type";

type EditMessage = { messageId: string, editedMessage: string };
type NotificationPayload = {
    conversationID: string;
    senderID: number;
    preview: string;
    timestamp: Date;
};
type ReactionData = {
    messageReaction: string,
    userID: number,
    messageID: string,
}
type DeleteMessage = {
    messageId: string,
}


export function registerMessageEvents(socket: Socket) {
    socket.on("getMessage", async (latestMessage: MessageDataType, callback?: Function) => {
        try {
            const messages = await getMessage(latestMessage.conversationID, latestMessage.createdAt);
            if (typeof callback === "function") {
                callback({ success: true, messages: messages });
            }
        } catch (error: any) {
            console.error("Error in getMessage:", error);
            if (typeof callback === "function") {
                callback({ success: false, error: "Failed to get messages: " + error.message });
            }
        }
    });
}

export function chatMessageEvent(socket: Socket, io: Server) {
    socket.on("chatMessage", async (msg: MessageDataType) => {
        console.log(msg)
        if (!msg.content || !msg.senderID || !msg.receiverID || !msg.conversationID) {
            console.error("Invalid message format:", msg);
            return;
        }

        const saveMessage: MessageDataType = await postMessage(
            msg.content,
            msg.senderID,
            msg.receiverID,
            msg.reactions,
            msg.conversationID
        );

        io.to(msg.conversationID).emit("receiveMessage", saveMessage);

        io.to(`user:${msg.receiverID}`).emit("newMessageNotification", {
            message: saveMessage,
            conversationID: msg.conversationID,
            senderID: msg.senderID,
            preview: msg.content.slice(0, 30),
            timestamp: new Date(),
        } as NotificationPayload);
    });
}

export function editMessage(socket: Socket, io: Server) {
    socket.on("editMessage", async (data: EditMessage) => {
        const updateMessage = await Message.findOneAndUpdate<IMessage>(
            { _id: data.messageId },
            { content: data.editedMessage },
            { new: true }
        );

        if (updateMessage) {
            io.to(updateMessage.conversationID).emit("messageEdited", updateMessage);
        }
    })
}

export function messageReaction(socket: Socket, io: Server) {
    socket.on("messageReaction", async (data: ReactionData) => {
        const { messageID, userID, messageReaction } = data;

        const updated = await Message.findOneAndUpdate<IMessage>(
            {
                _id: messageID,
                "reactions.userID": userID
            },
            {
                $set: {
                    "reactions.$.emoji": messageReaction
                }
            },
            { new: true }
        );
        console.log(updated);


        let finalMessage = updated;
        if (!updated) {
            finalMessage = await Message.findOneAndUpdate<IMessage>(
                { _id: messageID },
                {
                    $push: {
                        reactions: { userID, emoji: messageReaction }
                    }
                },
                { new: true }
            );
        }
        console.log(finalMessage);

        if (finalMessage) {
            io.to(finalMessage.conversationID).emit("messageReacted", finalMessage);
        }
    });
}

export function deleteMessage(socket: Socket, io: Server) {
    socket.on("deleteMessage", async (message: DeleteMessage) => {
        if (!message) throw new Error("Empty message to be deleted!");

        const existingMessage = await Message.findById({ _id: message.messageId });
        const conversationID = existingMessage?.conversationID;
        console.log(conversationID);

        if (!existingMessage) throw new Error("Message not found!");

        await existingMessage.deleteOne();

        io.to(conversationID as string).emit("deleteMessage", message.messageId);
    });
}

export function sendNotification(io: Server, userID: number, data: NotificationType) {
    io.to(`user:${userID}`).emit("Notification", data)
}