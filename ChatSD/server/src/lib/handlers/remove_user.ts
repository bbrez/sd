import { WebSocket } from "ws";
import prisma from "../db";
import send from "../send";

async function remove_user(socket: WebSocket, data: any) {
    try {
        let admin = await prisma.userChat.findFirstOrThrow({
            where: {
                id: data.admin.id,
                isAdmin: true,
                chatId: data.chat.id,
            }
        });

        console.log(`[${__filename}]: Admin found: ${admin}`);
        let remove_uc = await prisma.userChat.delete({
            where: {
                id: data.removed.id,
            }
        });

        console.log(`[${__filename}]: Deleted user from chat: ${remove_uc}`);
        send(socket, "remove_user", "success", { removed: remove_uc });
    } catch (err) {
        //TODO error handling
    }
}

export default remove_user;