// socket.server.ts
import { Socket, Server } from "socket.io";
import {
  chatMessageEvent,
  deleteMessage,
  editMessage,
  messageReaction,
  registerMessageEvents
} from "./event/message.event.js";
import { joinConversationEvent } from "./event/room.event.js";
import { initContact } from "./event/contact.event.js";
import { randomChat } from "./event/ramdomChat/randomChat.event.js";

// Socket.IO handler with JWT authentication
async function handleSocketConnection(io: Server) {
  io.on("connection", (socket: Socket) => {
    // ✅ user info is attached by authenticateTokenSocket middleware
    const user = (socket as any).user; 
    const user_id = user?.user_id;

    if (!user_id) {
      console.log("❌ Missing or invalid JWT payload. Disconnecting...");
      socket.disconnect();
      return;
    }

    // ✅ Join private user room
    socket.join(`user:${user_id}`);
    console.log(`✅ User ${user_id} connected via JWT`);

    // ---------------------------
    // ROOM EVENTS
    // ---------------------------
    socket.on("leaveRoom", (conversationID: string) => {
      socket.leave(conversationID);
      console.log(`👋 User ${user_id} left room: ${conversationID}`);
    });

    // ---------------------------
    // MESSAGE EVENTS
    // ---------------------------
    registerMessageEvents(socket);
    joinConversationEvent(socket);
    initContact(socket);
    chatMessageEvent(socket, io);
    editMessage(socket, io);
    messageReaction(socket, io);
    deleteMessage(socket, io);

    randomChat(socket, io)

    // ---------------------------
    // DISCONNECT EVENT
    // ---------------------------
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${user_id}`);
    });
  });
}

export default handleSocketConnection;
