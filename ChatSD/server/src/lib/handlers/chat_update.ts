import { WebSocket } from "ws";
import prisma from "../db";

async function chat_update(socket: WebSocket, data: any) {
    try {
        let admin = await prisma.userChat.findFirstOrThrow({
            where: {
                id: data.admin,
                isAdmin: true,
                chatId: data.chat.id,
            },
        });

        let chat = await prisma.chat.update({
            where: {
                id: data.chat.id,
            },
            data: {
                name: data.chat.name,
                icon: data.chat.icon,
            },
            include: {
                users: true
            }
        });

        return chat;
    } catch (err) {
        //TODO handle errors
    }
}

export default chat_update;