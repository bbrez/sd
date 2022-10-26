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

        console.log(`[${getFuncName()}]: Admin found: ${admin}`);
        let remove_uc = await prisma.userChat.delete({
            where: {
                id: data.removed.id,
            }
        });

        console.log(`[${getFuncName()}]: Deleted user from chat: ${remove_uc}`);
        send(socket, "remove_user", "success", remove_uc);
    } catch (err) {
        //TODO error handling
    }
}

export default remove_user;