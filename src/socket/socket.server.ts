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
import type { Router, WebRtcTransport, Producer, Consumer } from "mediasoup/node/lib/types";

// Extend the socket with mediasoup properties
interface ExtendedSocket extends Socket {
  transport?: WebRtcTransport;
  producer?: Producer;
  consumer?: Consumer;
}

async function handleSocketConnection(
  io: Server,
  getRouter: () => Router
) {
  io.on("connection", (rawSocket: Socket) => {

    getRouter();
    const socket = rawSocket as ExtendedSocket; // 👈 Cast to ExtendedSocket

    const user_id: number = (socket.request as any).session?.user_id;

    console.log(user_id);

    if (!user_id) {
      console.log("Missing user ID. Disconnecting...");
      socket.disconnect();
      return;
    }

    socket.join(`user:${user_id}`);
    console.log(`User ${user_id} connected with session ID:`, (socket.request as any).sessionID);

    // ---- mediasoup events ----
    socket.on("getRouterRtpCapabilities", (cb: Function) => {
      cb(getRouter().rtpCapabilities);
    });

    socket.on("createTransport", async (cb: Function) => {
      const transport = await getRouter().createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0", announcedIp: "YOUR_PUBLIC_IP" }],
        enableUdp: true,
        enableTcp: true,
      });

      socket.transport = transport; // ✅ now TS knows this is allowed

      cb({
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      });
    });

    socket.on("connectTransport", async (data: { dtlsParameters: any }, cb: Function) => {
      if (!socket.transport) return cb({ error: "No transport" });
      await socket.transport.connect({ dtlsParameters: data.dtlsParameters });
      cb("ok");
    });

    socket.on("produce", async (data: { kind: any; rtpParameters: any }, cb: Function) => {
      if (!socket.transport) return cb({ error: "No transport" });

      const producer = await socket.transport.produce({
        kind: data.kind,
        rtpParameters: data.rtpParameters,
      });

      socket.producer = producer;
      cb({ id: producer.id });

      socket.broadcast.emit("newProducer", { producerId: producer.id });
    });

    socket.on("consume", async (data: { producerId: string; rtpCapabilities: any }, cb: Function) => {
      const router = getRouter();

      if (!socket.transport) return cb({ error: "No transport" });

      if (!router.canConsume({ producerId: data.producerId, rtpCapabilities: data.rtpCapabilities })) {
        return cb({ error: "Cannot consume" });
      }

      const consumer = await socket.transport.consume({
        producerId: data.producerId,
        rtpCapabilities: data.rtpCapabilities,
        paused: true,
      });

      socket.consumer = consumer;

      cb({
        id: consumer.id,
        producerId: data.producerId,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
      });
    });

    // ---- chat + contact events ----
    socket.on("leaveRoom", (conversationID: string) => {
      socket.leave(conversationID);
      console.log(conversationID, socket.rooms);
    });

    registerMessageEvents(socket);
    joinConversationEvent(socket);
    initContact(socket);
    chatMessageEvent(socket, io);
    editMessage(socket, io);
    messageReaction(socket, io);
    deleteMessage(socket, io);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user_id}`);
    });
  });
}

export default handleSocketConnection;
