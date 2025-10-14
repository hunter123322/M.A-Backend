import { Socket } from "socket.io";
import { contactInit } from "../../service/socket/contact.socket.service"

export function initContact(socket: Socket) {
    socket.on("initContact", async (user_id: number, callback?: Function) => {
        const user = (socket as any).user;
        user_id = user?.user_id;

        try {
            const contacts = await contactInit(user_id);
            if (typeof callback === "function") {
                callback({ success: true, contacts: contacts })
            }
        } catch (error) {
            if (typeof callback === "function") {
                callback({ success: false, error: "Failed to initialize contact!" })
            }
        }
    })
}
