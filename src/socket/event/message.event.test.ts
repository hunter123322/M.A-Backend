import { describe, it, expect, mock, beforeEach } from "bun:test";
import { Server, Socket } from "socket.io";
import {
    registerMessageEvents,
    chatMessageEvent,
    editMessage,
    messageReaction,
    deleteMessage,
} from "./message.event";
import { Message } from "../../model/message/messages.model"; // Assuming this is your Mongoose model
import {
    getMessage,
    postMessage,
} from "../../service/message/message.socket.service";

// Mock the Mongoose Message model
mock.module("../../model/messages.model", () => ({
    default: {
        findOneAndUpdate: mock(),
        findById: mock(),
    },
}));

// Mock the service functions
mock.module("../../service/message/message.socket.service", () => ({
    getMessage: mock(),
    postMessage: mock(),
}));

// Create a helper to get the handler for a specific event
const getHandler = (
    mockSocket: any,
    eventName: string,
): ((...args: any[]) => void) => {
    const call = mockSocket.on.mock.calls.find((c: any) => c[0] === eventName);
    if (!call) {
        throw new Error(`Handler for event "${eventName}" not found.`);
    }
    return call[1];
};

describe("Message Events", () => {
    // Create mock Socket and Server objects
    const mockSocket = {
        on: mock(() => { }),
        emit: mock(() => { }),
    };
    const mockIo = {
        to: mock(() => mockSocket), // `io.to(...).emit(...)`
    };
    const dummyMessage = {
        _id: "msg123",
        content: "Hello world",
        senderID: "user456",
        receiverID: "user789",
        conversationID: "convo001",
        reactions: [],
        createdAt: new Date(),
        deleteOne: mock(() => Promise.resolve(null)),
    };

    // Reset mocks AND register event handlers before each test to prevent state bleed
    beforeEach(() => {
        mockSocket.on.mockClear();
        mockSocket.emit.mockClear();
        mockIo.to.mockClear();
        (Message.findOneAndUpdate as ReturnType<typeof mock>).mockClear();
        (Message.findById as ReturnType<typeof mock>).mockClear();
        (getMessage as ReturnType<typeof mock>).mockClear();
        (postMessage as ReturnType<typeof mock>).mockClear();

        // Register all event handlers inside the beforeEach block
        registerMessageEvents(mockSocket as any);
        chatMessageEvent(mockSocket as any, mockIo as any);
        editMessage(mockSocket as any, mockIo as any);
        messageReaction(mockSocket as any, mockIo as any);
        deleteMessage(mockSocket as any, mockIo as any);
    });

    // --- Test Cases for each handler ---

    describe("registerMessageEvents", () => {
        it("should register the 'getMessage' event and call the callback with messages on success", async () => {
            const handler = getHandler(mockSocket, "getMessage");
            const callback = mock();

            (getMessage as ReturnType<typeof mock>).mockResolvedValueOnce([dummyMessage]);

            await handler({ conversationID: "convo001", createdAt: new Date() }, callback);

            expect(getMessage).toHaveBeenCalledWith("convo001", expect.any(Date));
            expect(callback).toHaveBeenCalledWith({
                success: true,
                messages: [dummyMessage],
            });
        });

        it("should call the callback with an error on failure", async () => {
            const handler = getHandler(mockSocket, "getMessage");
            const callback = mock();
            const error = new Error("Failed to fetch");

            (getMessage as ReturnType<typeof mock>).mockRejectedValueOnce(error);

            await handler({ conversationID: "convo001", createdAt: new Date() }, callback);

            expect(getMessage).toHaveBeenCalled();
            expect(callback).toHaveBeenCalledWith({
                success: false,
                error: "Failed to get messages: " + error.message,
            });
        });
    });

    describe("chatMessageEvent", () => {
        it("should save the message and emit 'receiveMessage' and 'newMessageNotification' events", async () => {
            const handler = getHandler(mockSocket, "chatMessage");
            (postMessage as ReturnType<typeof mock>).mockResolvedValueOnce(dummyMessage);

            const msg = {
                content: "Hello",
                senderID: "user1",
                receiverID: "user2",
                conversationID: "convo1",
            };
            await handler(msg);

            expect(postMessage).toHaveBeenCalledWith(
                "Hello",
                "user1",
                "user2",
                undefined,
                "convo1",
            );
            expect(mockIo.to).toHaveBeenCalledWith("convo1");
            expect(mockSocket.emit).toHaveBeenCalledWith("receiveMessage", dummyMessage);
            expect(mockIo.to).toHaveBeenCalledWith(`user:${msg.receiverID}`);
            expect(mockSocket.emit).toHaveBeenCalledWith(
                "newMessageNotification",
                expect.objectContaining({
                    message: dummyMessage,
                    conversationID: "convo1",
                    senderID: "user1",
                    preview: "Hello",
                    timestamp: expect.any(Date),
                }),
            );
        });
    });

    describe("editMessage", () => {
        it("should find and update the message, then emit 'messageEdited'", async () => {
            const handler = getHandler(mockSocket, "editMessage");
            const updatedMessage = {
                ...dummyMessage,
                content: "Edited message",
            };
            (Message.findOneAndUpdate as ReturnType<typeof mock>).mockResolvedValueOnce(updatedMessage);

            await handler({
                messageId: "msg123",
                editedMessage: "Edited message",
            });

            expect(Message.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: "msg123" },
                { content: "Edited message" },
                { new: true },
            );
            expect(mockIo.to).toHaveBeenCalledWith("convo001");
            expect(mockSocket.emit).toHaveBeenCalledWith("messageEdited", updatedMessage);
        });
    });

    describe("messageReaction", () => {
        it("should update an existing reaction", async () => {
            const handler = getHandler(mockSocket, "messageReaction");
            const updatedWithReaction = {
                ...dummyMessage,
                reactions: [{ userID: "user456", emoji: "👍" }],
            };
            (Message.findOneAndUpdate as ReturnType<typeof mock>).mockResolvedValueOnce(updatedWithReaction);

            await handler({ messageID: "msg123", userID: "user456", messageReaction: "👍" });

            expect(Message.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: "msg123", "reactions.userID": "user456" },
                { $set: { "reactions.$.emoji": "👍" } },
                { new: true },
            );
            expect(mockIo.to).toHaveBeenCalledWith("convo001");
            expect(mockSocket.emit).toHaveBeenCalledWith("messageReacted", updatedWithReaction);
        });

        it("should add a new reaction if none exists for the user", async () => {
            const handler = getHandler(mockSocket, "messageReaction");
            const newReaction = { userID: "newUser1", emoji: "❤️" };
            const updatedWithNewReaction = {
                ...dummyMessage,
                reactions: [newReaction],
            };

            // First call returns null (no existing reaction)
            (Message.findOneAndUpdate as ReturnType<typeof mock>).mockResolvedValueOnce(null);
            // Second call (with $push) returns the newly updated message
            (Message.findOneAndUpdate as ReturnType<typeof mock>).mockResolvedValueOnce(
                updatedWithNewReaction,
            );

            await handler({ messageID: "msg123", userID: "newUser1", messageReaction: "❤️" });

            // First call to check for existing reaction
            expect(Message.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: "msg123", "reactions.userID": "newUser1" },
                { $set: { "reactions.$.emoji": "❤️" } },
                { new: true },
            );

            // Second call to add the new reaction
            expect(Message.findOneAndUpdate).toHaveBeenCalledWith(
                { _id: "msg123" },
                {
                    $push: {
                        reactions: { userID: "newUser1", emoji: "❤️" },
                    },
                },
                { new: true },
            );
            expect(mockIo.to).toHaveBeenCalledWith("convo001");
            expect(mockSocket.emit).toHaveBeenCalledWith("messageReacted", updatedWithNewReaction);
        });
    });

    describe("deleteMessage", () => {
        it("should find and delete a message, then emit 'deleteMessage'", async () => {
            const handler = getHandler(mockSocket, "deleteMessage");
            const dummyMessageWithDelete = {
                ...dummyMessage,
                deleteOne: mock().mockResolvedValueOnce(null),
            };
            (Message.findById as ReturnType<typeof mock>).mockResolvedValueOnce(dummyMessageWithDelete);

            await handler({ messageId: "msg123" });

            expect(Message.findById).toHaveBeenCalledWith({ _id: "msg123" });
            expect(dummyMessageWithDelete.deleteOne).toHaveBeenCalled();
            expect(mockIo.to).toHaveBeenCalledWith("convo001");
            expect(mockSocket.emit).toHaveBeenCalledWith("deleteMessage", "msg123");
        });

        it("should throw an error if the message is not found", async () => {
            const handler = getHandler(mockSocket, "deleteMessage");
            (Message.findById as ReturnType<typeof mock>).mockResolvedValueOnce(null);

            await expect(handler({ messageId: "nonexistent" })).rejects.toThrow(
                "Message not found!",
            );
        });

        it("should throw an error if the message ID is empty", async () => {
            const handler = getHandler(mockSocket, "deleteMessage");
            await expect(handler({})).rejects.toThrow("Message not found!");
        });
    });
});
