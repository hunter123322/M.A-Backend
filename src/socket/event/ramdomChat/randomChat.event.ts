import { randomUUIDv7 } from "bun";
import { Server, Socket } from "socket.io";

type Message = {
    senderID: string;
    content: string;
    convID: string
}

type UserInfo = {
    age: number;
    sex: "Male" | "Female";
}

const waitingUserMap = new Map<string, UserInfo>();
const inRoomUserMap = new Map<string, { roomId: string; userData: UserInfo }>();

waitingUserMap.set("1", { age: 15, sex: "Female" });
waitingUserMap.set("2", { age: 21, sex: "Female" });
waitingUserMap.set("3", { age: 28, sex: "Female" });


export async function randomChat(socket: Socket, io: Server) {
    const user = (socket as any).user;
    const user_id = user?.user_id;

    const matchUsers = (waitingId: string, waitingData: UserInfo, newId: string, newData: UserInfo) => {
        console.log("matched");

        const randomRoom = randomUUIDv7("hex", Date.now());

        // Join both users in the same room
        const waitingSocket = io?.sockets.sockets.get(waitingId);
        const newSocket = io?.sockets.sockets.get(newId);

        waitingSocket?.join(randomRoom);
        newSocket?.join(randomRoom);

        // Store both users in active room map
        inRoomUserMap.set(waitingId, { roomId: randomRoom, userData: waitingData });
        inRoomUserMap.set(newId, { roomId: randomRoom, userData: newData });

        // Remove the matched waiting user
        waitingUserMap.delete(waitingId);

        console.log(`🎯 Matched users: ${waitingId} ↔ ${newId} in room ${randomRoom}`);

        // Notify both users
        io?.to(waitingSocket?.id as string).emit("/chat/room/id", randomRoom);
        io?.to(newSocket?.id as string).emit("/chat/room/id", randomRoom);
        console.log(inRoomUserMap);

    };

    socket.on("/chat/room/waiting", (userData: UserInfo) => {
        console.log(`🕐 ${user_id} joined waiting queue with age: ${userData.age} and gender: ${userData.sex}`);

        if (waitingUserMap.size === 0) {
            waitingUserMap.set(socket.id, userData);
            console.log(`Waiting user: ${user_id}`);
        } else {
            let matchedID = '';
            let matchedData: UserInfo | null = null;

            for (const [key, value] of waitingUserMap) {
                // avoid matching with self
                if (key === socket.id) continue;

                if (value.sex === "Female" && (
                    value.age === userData.age ||
                    value.age === userData.age + 1 ||
                    value.age === userData.age - 1 ||
                    value.age === userData.age - 2 ||
                    value.age === userData.age + 2)
                ) {
                    matchedID = key;
                    matchedData = value;
                    break;
                }
            }

            if (matchedData) {
                matchUsers(matchedID, matchedData, socket.id, userData);
            } else {
                // fallback handling (push to waiting map or set timeout)
                waitingUserMap.set(socket.id, userData);
            }
        }


        console.log("📋 Current waiting users:", [...waitingUserMap.keys()]);
    });

    socket.on("/chat/room/message", (msg: Message) => {
        io.to(msg.convID).emit("/chat/room/receive/msg", msg);

    })

    const cleanup = () => {
        const roomInfo = inRoomUserMap.get(socket.id);
        if (roomInfo) {
            const { roomId } = roomInfo;
            socket.leave(roomId);
            inRoomUserMap.delete(socket.id);
            console.log(`👋 ${user_id} left room ${roomId}`);
        }

        if (waitingUserMap.has(socket.id)) {
            waitingUserMap.delete(socket.id);
            console.log(`❌ ${user_id} removed from waiting list`);
        }
    };

    socket.on("/chat/room/leave", cleanup);
    socket.on("disconnect", cleanup);
}
