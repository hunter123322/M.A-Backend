import { Socket } from "socket.io";

async function join(socket:Socket) {
    socket.on('randomChat', (randomRoom: string) => {
        socket.join(randomRoom)
    })
}