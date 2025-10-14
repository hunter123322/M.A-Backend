import { Server } from "socket.io";
const io = new Server(httpServer, { cors: { origin: "*" } });

// Keep a map of socket.id → user info
const userMap = new Map<string, { userId: string; name: string }>();

io.on("connection", (socket) => {
  console.log("New client:", socket.id);

  socket.on("register", (user) => {
    userMap.set(socket.id, user);
    console.log(`User registered: ${user.name}`);
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`${socket.id} joined room ${roomId}`);

    // Notify existing members
    const members = io.sockets.adapter.rooms.get(roomId);
    if (members) {
      const usersInRoom = Array.from(members).map(id => userMap.get(id));
      io.to(roomId).emit("room-members", usersInRoom);
    }
  });

  socket.on("disconnect", () => {
    userMap.delete(socket.id);
    console.log("Disconnected:", socket.id);
  });
});
